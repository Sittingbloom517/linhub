export const distributions = [
  { name: "Arch Linux", family: "Independent", manager: "pacman", description: "A flexible rolling-release distribution with a hands-on setup.", level: "Advanced", color: "blue" },
  { name: "Ubuntu", family: "Debian", manager: "apt", description: "A widely used distribution with a large community and broad support.", level: "Beginner friendly", color: "orange" },
  { name: "Fedora", family: "Red Hat", manager: "dnf", description: "A modern distribution with newer Linux technologies and strong defaults.", level: "Workstation", color: "purple" },
  { name: "Debian", family: "Debian", manager: "apt", description: "A stable, community-led base used on desktops and servers.", level: "Stable", color: "rose" },
  { name: "Linux Mint", family: "Ubuntu / Debian", manager: "apt", description: "A familiar desktop experience designed to be approachable.", level: "Beginner friendly", color: "green" },
  { name: "Bazzite", family: "Fedora Atomic", manager: "rpm-ostree / Flatpak", description: "An image-based desktop focused on gaming and reliable updates.", level: "Gaming", color: "cyan" }
];

export const commands = [
  { command: "uname -r", title: "Kernel version", description: "Show the version of the running Linux kernel.", category: "System" },
  { command: "cat /etc/os-release", title: "Distribution details", description: "Identify your installed Linux distribution and release.", category: "System" },
  { command: "systemctl --failed", title: "Failed services", description: "List systemd units that are currently in a failed state.", category: "System" },
  { command: "journalctl -b -p err", title: "Boot errors", description: "Show error-level journal messages from the current boot.", category: "Logs" },
  { command: "df -h", title: "Disk usage", description: "Display filesystem space in human-readable units.", category: "Storage" },
  { command: "lsblk -f", title: "Block devices", description: "List disks, partitions, filesystems, and mount points.", category: "Storage" },
  { command: "free -h", title: "Memory usage", description: "Show RAM and swap usage in readable units.", category: "System" },
  { command: "ip addr", title: "Network interfaces", description: "Show network interfaces and assigned addresses.", category: "Networking" }
];

export const recoveryTopics = [
  { title: "Kernel panic or system freeze", description: "Collect error details, identify recent changes, and look for a known-good boot entry.", level: "Advanced" },
  { title: "Linux will not boot", description: "Work through firmware, bootloader, and recovery-environment checks.", level: "Intermediate" },
  { title: "Package manager errors", description: "Understand interrupted transactions, repository issues, and package conflicts.", level: "Intermediate" },
  { title: "Network is not working", description: "Check link state, addresses, DNS, and the network service in order.", level: "Beginner" }
];

export const guides = [
  { title: "Install Linux in a virtual machine", category: "Getting started", time: "8 min", description: "Try a distribution safely before changing your main computer." },
  { title: "Understand Linux permissions", category: "Core concepts", time: "6 min", description: "Learn what read, write, execute, users, and groups mean." },
  { title: "Read system logs", category: "Troubleshooting", time: "5 min", description: "Find useful clues when a service or the system behaves strangely." },
  { title: "Choose a desktop environment", category: "Customization", time: "7 min", description: "Compare KDE Plasma, GNOME, Xfce, and other desktop choices." }
];
