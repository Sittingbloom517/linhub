//! Read-only PCI graphics-device detection.
//!
//! Prefer lspci when available for human-readable names. If it is missing or fails,
//! inspect Linux sysfs directly. The fallback reports PCI IDs rather than inventing
//! a marketing name when sysfs does not provide one.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const PCI_DEVICES_PATH: &str = "/sys/bus/pci/devices";

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuInfo {
    pub model: String,
    pub vendor: Option<String>,
    pub vendor_id: Option<String>,
    pub device_id: Option<String>,
    pub driver: Option<String>,
    pub pci_address: Option<String>,
    /// "lspci" or "sysfs", indicating how the device was identified.
    pub source: String,
}

/// Detect graphics-class PCI devices without requiring root privileges.
pub fn detect_gpus() -> Vec<GpuInfo> {
    let sysfs_devices = detect_gpus_from_sysfs(Path::new(PCI_DEVICES_PATH));

    if let Ok(output) = Command::new("lspci").args(["-D", "-nn"]).output() {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            let mut devices = parse_lspci_output(&text);

            if !devices.is_empty() {
                for device in &mut devices {
                    if let Some(address) = device.pci_address.as_deref() {
                        if let Some(sysfs) = sysfs_devices
                            .iter()
                            .find(|item| item.pci_address.as_deref() == Some(address))
                        {
                            device.driver = sysfs.driver.clone();
                            if device.vendor.is_none() {
                                device.vendor = sysfs.vendor.clone();
                            }
                        }
                    }
                }

                return devices;
            }
        }
    }

    sysfs_devices
}

/// Parse output from lspci -D -nn. Kept separate for deterministic tests.
pub fn parse_lspci_output(output: &str) -> Vec<GpuInfo> {
    let mut devices = Vec::new();

    for line in output.lines() {
        let Some((address, description)) = line.trim().split_once(char::is_whitespace) else {
            continue;
        };

        let lower = description.to_ascii_lowercase();
        if !(lower.contains("vga compatible controller")
            || lower.contains("3d controller")
            || lower.contains("display controller"))
        {
            continue;
        }

        let Some((_, raw_model)) = description.split_once(": ") else {
            continue;
        };

        let (vendor_id, device_id) = extract_pci_ids(raw_model);
        let model = remove_id_and_revision(raw_model);
        let vendor = vendor_id.as_deref().map(vendor_name);

        let model = if model.is_empty() {
            match (&vendor_id, &device_id) {
                (Some(vendor), Some(device)) => {
                    format!("{} graphics device ({}:{})", vendor_name(vendor), vendor, device)
                }
                _ => "Unknown graphics device".to_owned(),
            }
        } else {
            model
        };

        devices.push(GpuInfo {
            model,
            vendor,
            vendor_id,
            device_id,
            driver: None,
            pci_address: Some(address.to_owned()),
            source: "lspci".to_owned(),
        });
    }

    devices
}

/// Inspect a sysfs PCI devices directory. Public to allow testing against a
/// temporary directory without depending on the current machine.
pub fn detect_gpus_from_sysfs(pci_devices_root: &Path) -> Vec<GpuInfo> {
    let Ok(entries) = fs::read_dir(pci_devices_root) else {
        return Vec::new();
    };

    let mut devices = Vec::new();

    for entry in entries.flatten() {
        let device_path = entry.path();
        let Some(class) = read_trimmed(device_path.join("class")) else {
            continue;
        };
        let class = class.trim_start_matches("0x");
        if !class.starts_with("03") {
            continue;
        }

        let vendor_id = read_hex_id(device_path.join("vendor"));
        let device_id = read_hex_id(device_path.join("device"));
        let vendor = vendor_id.as_deref().map(vendor_name);
        let pci_address = entry.file_name().to_string_lossy().into_owned();
        let driver = read_driver_name(&device_path);

        let sysfs_name = ["product_name", "label", "model"]
            .iter()
            .find_map(|filename| read_trimmed(device_path.join(filename)))
            .filter(|value| !value.is_empty());

        let model = sysfs_name.unwrap_or_else(|| {
            match (&vendor_id, &device_id) {
                (Some(vendor_id), Some(device_id)) => format!(
                    "{} graphics device ({}:{})",
                    vendor.as_deref().unwrap_or("Unknown vendor"),
                    vendor_id,
                    device_id
                ),
                _ => format!(
                    "{} graphics device",
                    vendor.as_deref().unwrap_or("Unknown vendor")
                ),
            }
        });

        devices.push(GpuInfo {
            model,
            vendor,
            vendor_id,
            device_id,
            driver,
            pci_address: Some(pci_address),
            source: "sysfs".to_owned(),
        });
    }

    devices.sort_by(|left, right| left.pci_address.cmp(&right.pci_address));
    devices
}

fn extract_pci_ids(value: &str) -> (Option<String>, Option<String>) {
    for segment in value.split('[').skip(1) {
        let Some((candidate, _)) = segment.split_once(']') else {
            continue;
        };
        let Some((vendor, device)) = candidate.split_once(':') else {
            continue;
        };

        if is_hex_id(vendor) && is_hex_id(device) {
            return (
                Some(vendor.to_ascii_lowercase()),
                Some(device.to_ascii_lowercase()),
            );
        }
    }

    (None, None)
}

fn is_hex_id(value: &str) -> bool {
    value.len() == 4 && value.chars().all(|character| character.is_ascii_hexdigit())
}

fn remove_id_and_revision(value: &str) -> String {
    let mut model = value.trim().to_owned();

    if let Some(start) = model.rfind('[') {
        if let Some(end_offset) = model[start..].find(']') {
            let end = start + end_offset + 1;
            let candidate = &model[start + 1..end - 1];
            if let Some((vendor, device)) = candidate.split_once(':') {
                if is_hex_id(vendor) && is_hex_id(device) {
                    model.replace_range(start..end, "");
                }
            }
        }
    }

    if let Some(revision_start) = model.rfind(" (rev ") {
        if model.ends_with(')') {
            model.truncate(revision_start);
        }
    }

    model.trim().to_owned()
}

fn read_hex_id(path: PathBuf) -> Option<String> {
    read_trimmed(path).map(|value| value.trim_start_matches("0x").to_ascii_lowercase())
}

fn read_trimmed(path: PathBuf) -> Option<String> {
    fs::read_to_string(path)
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
}

fn read_driver_name(device_path: &Path) -> Option<String> {
    fs::read_link(device_path.join("driver"))
        .ok()
        .and_then(|target| target.file_name().map(|name| name.to_string_lossy().into_owned()))
}

fn vendor_name(vendor_id: &str) -> String {
    match vendor_id.to_ascii_lowercase().as_str() {
        "10de" => "NVIDIA".to_owned(),
        "1002" | "1022" => "AMD".to_owned(),
        "8086" => "Intel".to_owned(),
        "13b5" => "Arm".to_owned(),
        "106b" => "Apple".to_owned(),
        "1af4" => "Virtio".to_owned(),
        _ => format!("PCI vendor 0x{}", vendor_id),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn parses_lspci_vga_and_display_controllers() {
        let output = concat!(
            "0000:01:00.0 VGA compatible controller [0300]: NVIDIA Corporation GP107 [GeForce GTX 1050 Ti] [10de:1c82] (rev a1)\n",
            "0000:00:02.0 Display controller [0380]: Intel Corporation UHD Graphics [8086:3e92]\n",
            "0000:02:00.0 Ethernet controller [0200]: Example Network Adapter [1234:5678]\n"
        );

        let devices = parse_lspci_output(output);
        assert_eq!(devices.len(), 2);
        assert_eq!(devices[0].pci_address.as_deref(), Some("0000:01:00.0"));
        assert_eq!(devices[0].vendor.as_deref(), Some("NVIDIA"));
        assert_eq!(devices[0].device_id.as_deref(), Some("1c82"));
        assert!(devices[0].model.contains("GeForce GTX 1050 Ti"));
        assert_eq!(devices[1].vendor.as_deref(), Some("Intel"));
    }

    #[test]
    fn sysfs_fallback_reads_pci_ids() {
        let root = temporary_directory("linhub-gpu-test");
        let device = root.join("0000:01:00.0");
        fs::create_dir_all(&device).expect("create device directory");
        fs::write(device.join("class"), "0x030000\n").expect("write class");
        fs::write(device.join("vendor"), "0x10de\n").expect("write vendor");
        fs::write(device.join("device"), "0x1c82\n").expect("write device");

        let devices = detect_gpus_from_sysfs(&root);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].vendor.as_deref(), Some("NVIDIA"));
        assert_eq!(devices[0].vendor_id.as_deref(), Some("10de"));
        assert_eq!(devices[0].device_id.as_deref(), Some("1c82"));
        assert_eq!(devices[0].source, "sysfs");
        assert!(devices[0].model.contains("10de:1c82"));

        fs::remove_dir_all(root).expect("remove temporary directory");
    }

    #[test]
    fn sysfs_fallback_ignores_non_graphics_devices() {
        let root = temporary_directory("linhub-non-gpu-test");
        let device = root.join("0000:02:00.0");
        fs::create_dir_all(&device).expect("create device directory");
        fs::write(device.join("class"), "0x020000\n").expect("write class");

        assert!(detect_gpus_from_sysfs(&root).is_empty());
        fs::remove_dir_all(root).expect("remove temporary directory");
    }

    #[test]
    fn missing_sysfs_directory_returns_empty_list() {
        let root = temporary_directory("linhub-missing-test").join("does-not-exist");
        assert!(detect_gpus_from_sysfs(&root).is_empty());
    }

    fn temporary_directory(prefix: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "{}-{}-{}",
            prefix,
            std::process::id(),
            nanos
        ));
        fs::create_dir_all(&path).expect("create temporary test directory");
        path
    }
}
