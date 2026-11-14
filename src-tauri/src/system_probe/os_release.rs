//! Parser for Linux /etc/os-release files.
//!
//! This parses the file as data. It never sources or evaluates it as shell code.

use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::Path;

/// A normalized subset of the os-release specification.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OsReleaseInfo {
    pub id: Option<String>,
    pub id_like: Option<String>,
    pub name: Option<String>,
    pub pretty_name: Option<String>,
    pub version: Option<String>,
    pub version_id: Option<String>,
    pub variant: Option<String>,
    pub variant_id: Option<String>,
}

impl OsReleaseInfo {
    /// Human-readable distro label, preferring PRETTY_NAME.
    pub fn display_name(&self) -> Option<&str> {
        self.pretty_name
            .as_deref()
            .filter(|value| !value.is_empty())
            .or_else(|| self.name.as_deref().filter(|value| !value.is_empty()))
            .or_else(|| self.id.as_deref().filter(|value| !value.is_empty()))
    }
}

/// Read and parse an os-release-compatible file.
pub fn read_os_release(path: impl AsRef<Path>) -> io::Result<OsReleaseInfo> {
    let contents = fs::read_to_string(path)?;
    Ok(parse_os_release(&contents))
}

/// Parse os-release text without invoking a shell.
pub fn parse_os_release(contents: &str) -> OsReleaseInfo {
    let mut values = HashMap::<String, String>::new();

    for line in contents.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        let Some((key, raw_value)) = line.split_once('=') else {
            continue;
        };

        let key = key.trim();
        if key.is_empty()
            || !key.chars().all(|character| {
                character.is_ascii_uppercase()
                    || character.is_ascii_digit()
                    || character == '_'
            })
        {
            continue;
        }

        values.insert(key.to_owned(), parse_value(raw_value));
    }

    OsReleaseInfo {
        id: values.remove("ID"),
        id_like: values.remove("ID_LIKE"),
        name: values.remove("NAME"),
        pretty_name: values.remove("PRETTY_NAME"),
        version: values.remove("VERSION"),
        version_id: values.remove("VERSION_ID"),
        variant: values.remove("VARIANT"),
        variant_id: values.remove("VARIANT_ID"),
    }
}

/// Remove optional quotes and decode the documented double-quote escape subset.
fn parse_value(raw_value: &str) -> String {
    let value = raw_value.trim();

    if value.len() >= 2 && value.starts_with('"') && value.ends_with('"') {
        let inner = &value[1..value.len() - 1];
        let mut result = String::with_capacity(inner.len());
        let mut chars = inner.chars();

        while let Some(character) = chars.next() {
            if character == '\\' {
                match chars.next() {
                    Some(escaped @ ('\\' | '"' | '$' | '\x60')) => result.push(escaped),
                    Some(other) => {
                        result.push('\\');
                        result.push(other);
                    }
                    None => result.push('\\'),
                }
            } else {
                result.push(character);
            }
        }

        return result;
    }

    if value.len() >= 2 && value.starts_with('\'') && value.ends_with('\'') {
        return value[1..value.len() - 1].to_owned();
    }

    value.to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_common_distribution_fields() {
        let parsed = parse_os_release(
            r#"NAME="Fedora Linux"
ID=fedora
ID_LIKE="rhel centos"
VERSION="42 (Workstation Edition)"
VERSION_ID=42
PRETTY_NAME="Fedora Linux 42 (Workstation Edition)"
"#,
        );

        assert_eq!(parsed.id.as_deref(), Some("fedora"));
        assert_eq!(parsed.id_like.as_deref(), Some("rhel centos"));
        assert_eq!(
            parsed.display_name(),
            Some("Fedora Linux 42 (Workstation Edition)")
        );
        assert_eq!(parsed.version_id.as_deref(), Some("42"));
    }

    #[test]
    fn handles_comments_blank_lines_and_malformed_entries() {
        let parsed = parse_os_release(
            "# comment\n\nID=arch\nthis is not an assignment\nBAD-KEY=value\n",
        );
        assert_eq!(parsed.id.as_deref(), Some("arch"));
        assert_eq!(parsed.name, None);
    }

    #[test]
    fn decodes_double_quote_escapes() {
        let parsed = parse_os_release(r#"PRETTY_NAME="A \"quoted\" distro \\ edition""#);
        assert_eq!(
            parsed.pretty_name.as_deref(),
            Some("A \"quoted\" distro \\ edition")
        );
    }

    #[test]
    fn preserves_single_quoted_values_literally() {
        let parsed = parse_os_release("NAME='Linux $HOME'");
        assert_eq!(parsed.name.as_deref(), Some("Linux $HOME"));
    }

    #[test]
    fn display_name_falls_back_to_name_then_id() {
        assert_eq!(parse_os_release("NAME=Debian").display_name(), Some("Debian"));
        assert_eq!(parse_os_release("ID=debian").display_name(), Some("debian"));
        assert_eq!(parse_os_release("ID=").display_name(), None);
    }
}
