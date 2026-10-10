export const sources = {
  usingDevmgr: ['Using Device Manager, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-hardware/drivers/install/using-device-manager'],
  openDevmgr: ['Open Device Manager (devmgmt.msc), Microsoft Learn', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/cc754081(v=ws.10)'],
  updateDrivers: ['Update drivers through Device Manager in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/update-drivers-through-device-manager-in-windows-ec62f46c-ff14-c91d-eead-d7126dc1f7b6'],
  errorCodes: ['Device Manager Error Messages, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-hardware/drivers/install/device-manager-error-messages'],
  code28: ['CM_PROB_FAILED_INSTALL (Code 28), Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-failed-install'],
  code22: ['CM_PROB_DISABLED (Code 22), Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-disabled'],
  diskOverview: ['Overview of Disk Management, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/storage/disk-management/overview-of-disk-management'],
  initDisk: ['Initialize new disks, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/storage/disk-management/initialize-new-disks'],
  over2tb: ['Windows support for hard disks exceeding 2 TB, Microsoft Learn', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/backup-and-storage/support-for-hard-disks-exceeding-2-tb'],
  driveLetter: ['Change a drive letter, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/storage/disk-management/change-a-drive-letter'],
  troubleshootDisk: ['Troubleshoot Disk Management, Microsoft Learn', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/backup-and-storage/troubleshoot-disk-management'],
  createPartition: ['Create and format a hard disk partition, Microsoft Support', 'https://support.microsoft.com/en-us/windows/create-and-format-a-hard-disk-partition-bbb8e185-1bda-ecd1-3465-c9728f7d7d2e'],
  appCrash: ['The application or service crashing behavior troubleshooting guidance, Microsoft Learn', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/performance/troubleshoot-application-service-crashing-behavior'],
  eventViewer: ['Event Viewer (Inside show), Microsoft Learn', 'https://learn.microsoft.com/en-us/shows/inside/event-viewer'],
  perfmonCmd: ['perfmon command reference, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/perfmon'],
  reliability: ['Use Reliability Monitor to Troubleshoot, Microsoft Learn (archived)', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/cc749583(v=ws.10)'],
  wevtutil: ['wevtutil command reference, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil'],
  uninstallApps: ['Uninstall or remove apps and programs in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/uninstall-or-remove-apps-and-programs-in-windows-4b55f974-2cc6-2d2b-d092-5905080eaf98'],
  spoolerNotRunning: ['Printing issues caused by Print Spooler service not running, Microsoft Learn', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/printing/print-spooler-service-not-running'],
  serviceList: ['Security guidelines for system services in Windows Server 2016, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/security/windows-services/security-guidelines-for-disabling-system-services-in-windows-server'],
  serviceStartup: ['Configure How a Service Is Started, Microsoft Learn (archived)', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc755249(v=ws.11)'],
  setService: ['Set-Service (StartupType values), Microsoft Learn', 'https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/set-service'],
  addPrinter: ['Add a printer or scanner in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/add-a-printer-or-scanner-in-windows-14d9a442-0bcb-e11c-7a6c-63f00efae79f'],
  testPage: ['Fix printing problems in Word, Excel, or other apps, Microsoft Support', 'https://support.microsoft.com/en-us/windows/hardware/printer/fix-printing-problems-in-word-excel-or-other-apps'],
  startupApps: ['Configure startup applications in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/configure-startup-applications-in-windows-115a420a-0bff-4a6f-90e0-1934c844e473'],
  localAccounts: ['Local accounts, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/security/identity-protection/access-control/local-accounts'],
  rdsLogon: ['Allow log on through Remote Desktop Services, Microsoft Learn', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/allow-log-on-through-remote-desktop-services'],
  addGroupMember: ['Add a member to a local group, Microsoft Learn (archived)', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/cc772524(v=ws.10)'],
  remoteDesktop: ['How to use Remote Desktop, Microsoft Support', 'https://support.microsoft.com/en-us/windows/how-to-use-remote-desktop-5fe128d5-8fb1-7a23-3b8a-41e636865e8c'],
  netSettings: ['Essential network settings and tasks in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/essential-network-settings-and-tasks-in-windows-f21a9bbc-c582-55cd-35e0-73431160a1b9'],
  launchSettings: ['Launch Windows Settings (ms-settings: URIs), Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings'],
  firewall: ['Firewall and network protection in the Windows Security app, Microsoft Support', 'https://support.microsoft.com/en-us/windows/firewall-and-network-protection-in-the-windows-security-app-ec0844f7-aebd-0583-67fe-601ecf5d774f'],
  virusProtection: ['Virus and threat protection in the Windows Security app, Microsoft Support', 'https://support.microsoft.com/en-us/windows/virus-and-threat-protection-in-the-windows-security-app-1362f4cd-d71a-b52a-0b66-c2820032b65e'],
  rtpOff: ['Turn off Defender antivirus protection in Windows Security, Microsoft Support', 'https://support.microsoft.com/en-us/windows/turn-off-defender-antivirus-protection-in-windows-security-99e6004f-c54c-8509-773c-a4d776b77960'],
  tamper: ['Prevent changes to security settings with Tamper Protection, Microsoft Support', 'https://support.microsoft.com/en-us/windows/prevent-changes-to-security-settings-with-tamper-protection-31d51aaa-645d-408e-6ce7-8d7f8e593f87'],
  defenderOffline: ['Help protect my PC with Microsoft Defender Offline, Microsoft Support', 'https://support.microsoft.com/en-us/windows/help-protect-my-pc-with-microsoft-defender-offline-9306d528-64bf-4668-5b80-ff533f183d6c'],
};

// Primer section `body`: a string, or an array of paragraph strings and tables (arrays of rows, first row = header).
export const primer = {
  title: 'Windows tools refresher',
  sections: [
    { h: 'Opening a tool three ways', body: [
      'Start search: select Start and type the tool name, for example device manager. Run box: press Windows+R and type the console file name, for example devmgmt.msc. Right-click Start: the quick link menu lists Device Manager, Disk Management, Event Viewer, Task Manager and others. On the exam, know the file name of each console.',
      [
        ['Tool', 'Run name', 'Use it for'],
        ['Device Manager', 'devmgmt.msc', 'Device status, drivers, disable or enable hardware'],
        ['Disk Management', 'diskmgmt.msc', 'Initialize disks, create and format volumes, drive letters'],
        ['Event Viewer', 'eventvwr.msc', 'Application, System and Security logs'],
        ['Reliability Monitor', 'perfmon /rel', 'Stability history: failures and software installs by date'],
        ['Services', 'services.msc', 'Start, stop and set the startup type of services'],
        ['Local Users and Groups', 'lusrmgr.msc', 'Local accounts and group membership (Pro and higher editions)'],
        ['Task Scheduler', 'taskschd.msc', 'Scheduled tasks'],
        ['Certificate Manager', 'certmgr.msc', 'Current user certificates'],
        ['Group Policy Editor', 'gpedit.msc', 'Local policy settings'],
        ['Performance Monitor', 'perfmon.msc', 'Performance counters and reports'],
      ],
    ] },
    { h: 'Reading a device problem', body: 'Device Manager marks a problem device with a yellow exclamation point. A device whose type Windows cannot identify may appear under Other devices; find the problem device, open Properties, and read Device status on the General tab. The status ends with a code that names the problem, for example Code 28: The drivers for this device are not installed, or Code 22: This device is disabled.' },
    { h: 'Installing a driver you already have', body: 'Right-click the device > Update driver. The automatic search looks for a driver Windows can find by itself; if it finds nothing, Windows Update can be searched next. Browse my computer for drivers lets you point Windows at the folder that holds the manufacturer driver package. For Code 28, Microsoft recommends getting the most recent driver from the company that makes the device.' },
    { h: 'Change only the device with the problem', body: 'Disable device and Uninstall device on a working controller do not fix a different device. Disabling a USB Root Hub stops devices connected through that hub and could also disconnect a USB keyboard or mouse if either uses it. If you disable something by mistake, right-click it and select Enable device.' },
    { h: 'A new disk in Disk Management', body: [
      'A new disk does not appear in File Explorer until it is initialized, holds a formatted volume and has a drive letter. Disk Management lists it as Not Initialized (its type can show Unknown). Right-click the disk > Initialize Disk, keep the default partition style GPT, then right-click the Unallocated space > New Simple Volume: accept the full size, pick the drive letter, choose NTFS and select Finish. Initializing or formatting erases data, so check the disk number, size and status twice. Leave the EFI System and Recovery partitions alone.',
      [
        ['Partition style', 'When'],
        ['GUID Partition Table (GPT)', 'The default and the normal choice for internal drives; needed for volumes larger than 2 TB'],
        ['Master Boot Record (MBR)', 'Older style used by older computers and removable media such as memory cards'],
      ],
    ] },
    { h: 'Event Viewer and Reliability Monitor', body: 'Event Viewer > Windows Logs holds the Application, Security and System logs. An application crash is logged in Application as an Error from source Application Error with Event ID 1000; its description names the faulting application and the faulting module, the file that was running when it failed. Windows Error Reporting logs Event ID 1001 next to it. Reliability Monitor (perfmon /rel) shows the same failures on a timeline next to software installs, which makes "it started after we installed X" easy to see. Never clear a log you are investigating: clearing deletes the evidence.' },
    { h: 'Services and startup types', body: [
      'Open services.msc, right-click a service > Properties. On the General tab set Startup type, select Apply, then use Start, Stop or the other buttons under Service status. A Disabled service cannot be started until its startup type is changed. Print Spooler (service name Spooler) is Automatic by default; when it is stopped you cannot print or see your printers.',
      [
        ['Startup type', 'Meaning'],
        ['Automatic', 'Started by Windows at system startup'],
        ['Automatic (Delayed Start)', 'Started shortly after the system boots'],
        ['Manual', 'Started only when a user, the Service Control Manager or an application starts it'],
        ['Disabled', 'Cannot be started by a user or an application'],
      ],
    ] },
    { h: 'Startup apps', body: [
      'Apps that start when you sign in slow down sign-in. Task Manager > Startup apps lists each app with its startup impact; select an app and select Disable to stop it from starting automatically (Settings > Apps > Startup has the same switches). Disabling is reversible and does not uninstall anything. Keep security software enabled.',
      [
        ['Startup impact', 'Meaning'],
        ['High Impact', 'More than 1 second of CPU time or more than 3 MB of disk use at startup'],
        ['Medium Impact', '300 ms to 1 second of CPU time, or 292 KB to 3 MB of disk use'],
        ['Low Impact', 'Less than 300 ms of CPU time and less than 292 KB of disk use'],
        ['Not Measured', 'Enabled, but no data yet'],
        ['None', 'The startup app is disabled'],
      ],
    ] },
    { h: 'Local users and groups', body: 'Local Users and Groups (lusrmgr.msc, or Computer Management > Local Users and Groups) holds the Users and Groups folders. Rights come from group membership. Administrators have full control of the device, so keep that group small. To let someone sign in with Remote Desktop without admin rights, add them to Remote Desktop Users. A Windows 11 PC must run Pro (or higher) to accept Remote Desktop connections, and Remote Desktop is turned on in Settings > System > Remote Desktop.' },
    { h: 'Static IPv4 in Settings', body: 'Settings > Network & internet > Ethernet (or Wi-Fi > Manage known networks > the network) > IP assignment > Edit. Choose Manual, turn on IPv4 and fill in IP address, Subnet mask, Gateway, Preferred DNS and Alternate DNS, then Save. A /24 prefix is the subnet mask 255.255.255.0. The gateway must be inside the same subnet as the address. With a manual address, enter the DNS servers too, or names will not resolve.' },
    { h: 'Windows Security basics', body: 'Virus & threat protection > Manage settings holds Real-time protection and Tamper protection. Real-time protection scans files as you open or download them; if someone turns it off it comes back on after a short while, but turn it back on right away. Tamper protection stops malicious apps from changing these settings. Firewall & network protection lists Domain network, Private network and Public network, each with its own Microsoft Defender Firewall switch. On untrusted networks such as cafes, the network profile type should be Public network and its firewall must be on. A Quick scan checks the places malware usually hides; Microsoft Defender Antivirus (offline scan) restarts the PC and scans before Windows loads, for when you suspect an infection.' },
  ],
  src: ['usingDevmgr', 'openDevmgr', 'updateDrivers', 'code28', 'code22', 'initDisk', 'troubleshootDisk', 'appCrash', 'perfmonCmd', 'serviceList', 'setService', 'startupApps', 'localAccounts', 'rdsLogon', 'netSettings', 'firewall', 'virusProtection', 'defenderOffline'],
};

export const terms = {
  'Device Manager': 'The Windows console (devmgmt.msc) that lists hardware by type and shows each device status and driver.',
  driver: 'Software that lets Windows talk to a specific piece of hardware.',
  'Code 28': 'Device Manager status: The drivers for this device are not installed.',
  'COM port': 'A serial port. USB-to-serial adapters appear under Ports (COM & LPT) once their driver is installed.',
  'console cable': 'A serial cable used to manage a switch or router directly, often through a USB-to-serial adapter.',
  'Disk Management': 'The Windows console (diskmgmt.msc) that initializes disks and creates, formats and letters volumes.',
  initialize: 'Write a partition style (GPT or MBR) to a new disk so Windows can use it. It erases anything already on the disk.',
  GPT: 'GUID Partition Table, the default partition style for internal drives; supports volumes larger than 2 TB.',
  NTFS: 'The standard Windows file system for internal drives.',
  'Event ID': 'The number that identifies a type of event from a given source, for example 1000 from Application Error.',
  'faulting module': 'The file (often a .dll) that was running code when an application crashed, named in Event ID 1000.',
  'Reliability Monitor': 'A timeline of failures and software installs with a stability index, opened with perfmon /rel.',
  'Print Spooler': 'The Windows service (Spooler) that queues print jobs and talks to printers.',
  'startup type': 'How Windows starts a service: Automatic, Automatic (Delayed Start), Manual or Disabled.',
  'startup impact': 'How much CPU time and disk usage an app causes when it starts at sign-in, shown in Task Manager > Startup apps.',
  'Remote Desktop Users': 'The local group whose members may sign in through Remote Desktop without being administrators.',
  'least privilege': 'Give each account only the rights it needs for its job.',
  'subnet mask': 'Marks which part of an IPv4 address is the network. 255.255.255.0 is the same as /24.',
  'default gateway': 'The router address a PC sends traffic to when the destination is outside its own subnet.',
  'Real-time protection': 'Microsoft Defender Antivirus scanning of files as they are opened or downloaded.',
  'Tamper protection': 'A Windows Security setting that stops malicious apps from changing Defender settings.',
  'Public network': 'The network profile for untrusted networks: the PC is hidden from other devices and sharing is off.',
};

const WORKING = 'This device is working properly.';
const DRIVER_FOLDER = 'C:\\Drivers\\USB-Serial';

// Case-insensitive, whitespace-tolerant exact-match pattern for the engine's `matches` operator.
const exact = (text) => `^\\s*${[...text].map((ch) => (/[a-z]/i.test(ch) ? `[${ch.toLowerCase()}${ch.toUpperCase()}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('')}\\s*$`;
const is = (key, value) => ({ key, op: 'eq', value });
const step = (type, rest, explain) => ({ do: { type, ...rest }, ...(explain ? { explain } : {}) });
const launch = (query, explain) => step('launch', { query }, explain);
const act = (controlId, rowId, actionId, explain) => step('act', { controlId, rowId: rowId ?? null, actionId: actionId ?? null }, explain);
const set = (controlId, value, explain) => step('set', { controlId, value }, explain);

const win01 = {
  id: 'win-01', title: 'Install a missing USB adapter driver', level: 1, minutes: 6,
  scenario: `Marisol at Harbor Point Clinic plugged a USB-to-serial adapter into DESK-07 to reach a network switch console, but no COM port shows up. The adapter maker's driver package is already extracted to ${DRIVER_FOLDER}. Find out what Windows reports for the adapter and get it working.`,
  examObjs: { 'aplus-1202': ['1.4'] }, objs: [],
  skin: 'windows',
  state: {
    'serial.name': 'USB-Serial Controller', 'serial.category': 'Other devices', 'serial.maker': 'Unknown',
    'serial.status': 'The drivers for this device are not installed. (Code 28)', 'serial.present': true,
    'hub.status': WORKING,
    'browse.path': 'C:\\Users\\mreyes\\Documents', 'browse.subfolders': true,
  },
  apps: [
    { id: 'devmgmt', name: 'Device Manager', launch: ['devmgmt.msc', 'device manager', 'mmc devmgmt.msc'], icon: 'devmgmt', home: 'devices' },
    { id: 'settings', name: 'Settings', launch: ['ms-settings:', 'settings', { q: 'ms-settings:windowsupdate', screen: 'windows-update' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'devices', app: 'devmgmt', title: 'Device Manager', crumbs: ['DESK-07'], controls: [
      { id: 'devices', type: 'list', label: 'Devices by type', rows: [
        { id: 'keyboard', cells: ['Keyboards', 'HID Keyboard Device'], status: WORKING, actions: [] },
        { id: 'serial', visibleIf: { key: 'serial.present', op: 'truthy' }, cells: ['{{serial.category}}', '{{serial.name}}'], status: '{{serial.status}}', actions: [
          { id: 'properties', label: 'Properties', action: { open: 'serial-props' } },
          { id: 'update-driver', label: 'Update driver', action: { open: 'update-drivers' } },
          { id: 'uninstall', label: 'Uninstall device', action: { set: { 'serial.present': false }, confirm: 'Uninstall Device', msg: 'The device was removed from the list. Action > Scan for hardware changes detects it again.' } },
        ] },
        { id: 'hub', cells: ['Universal Serial Bus controllers', 'USB Root Hub (USB 3.0)'], status: '{{hub.status}}', actions: [
          { id: 'disable', label: 'Disable device', visibleIf: { key: 'hub.status', op: 'eq', value: WORKING }, action: { set: { 'hub.status': 'This device is disabled. (Code 22)' }, confirm: 'Disabling this device will cause it to stop functioning. Do you really want to disable it?', msg: 'USB Root Hub (USB 3.0) is disabled.' } },
          { id: 'enable', label: 'Enable device', visibleIf: { key: 'hub.status', op: 'ne', value: WORKING }, action: { set: { 'hub.status': WORKING }, msg: 'USB Root Hub (USB 3.0) is enabled.' } },
        ] },
      ] },
      { id: 'scan', type: 'button', label: 'Action > Scan for hardware changes', action: { set: { 'serial.present': true }, msg: 'Scan complete.' } },
    ] },
    { id: 'serial-props', app: 'devmgmt', title: '{{serial.name}} Properties', crumbs: ['DESK-07', '{{serial.name}}'], controls: [
      { id: 'general', type: 'info', label: 'General', values: [['Device type:', '{{serial.category}}'], ['Manufacturer:', '{{serial.maker}}'], ['Location:', 'Port_#0002.Hub_#0001'], ['Device status', '{{serial.status}}']] },
      { id: 'props-update', type: 'link', label: 'Driver tab > Update Driver', screen: 'update-drivers' },
      { id: 'props-ok', type: 'link', label: 'OK', screen: 'devices' },
    ] },
    { id: 'update-drivers', app: 'devmgmt', title: 'Update Drivers - {{serial.name}}', controls: [
      { id: 'how', type: 'info', text: 'How do you want to search for drivers?' },
      { id: 'auto', type: 'button', label: 'Search automatically for drivers', action: { msg: 'Automatic search did not find a compatible driver. Browse to the extracted manufacturer package.' } },
      { id: 'browse', type: 'link', label: 'Browse my computer for drivers', screen: 'browse-drivers' },
      { id: 'cancel', type: 'link', label: 'Cancel', screen: 'devices' },
    ] },
    { id: 'browse-drivers', app: 'devmgmt', title: 'Update Drivers - {{serial.name}}', controls: [
      { id: 'heading', type: 'info', text: 'Browse for drivers on your computer' },
      { id: 'path', type: 'select', label: 'Search for drivers in this location:', key: 'browse.path', options: ['C:\\Users\\mreyes\\Documents', 'C:\\Users\\mreyes\\Downloads', 'C:\\Drivers', DRIVER_FOLDER] },
      { id: 'subfolders', type: 'toggle', label: 'Include subfolders', key: 'browse.subfolders' },
      { id: 'next', type: 'button', label: 'Next',
        visibleIf: { any: [{ key: 'browse.path', op: 'eq', value: DRIVER_FOLDER }, { all: [{ key: 'browse.path', op: 'eq', value: 'C:\\Drivers' }, { key: 'browse.subfolders', op: 'truthy' }] }] },
        action: { set: { 'serial.name': 'USB Serial Port (COM3)', 'serial.category': 'Ports (COM & LPT)', 'serial.maker': 'Fabrikam', 'serial.status': WORKING }, open: 'devices', msg: 'Windows installed the driver from the package. The adapter now shows as USB Serial Port (COM3) under Ports (COM & LPT).' } },
      { id: 'next-none', type: 'button', label: 'Next',
        visibleIf: { not: { any: [{ key: 'browse.path', op: 'eq', value: DRIVER_FOLDER }, { all: [{ key: 'browse.path', op: 'eq', value: 'C:\\Drivers' }, { key: 'browse.subfolders', op: 'truthy' }] }] } },
        action: { msg: 'Windows found no driver for {{serial.name}} in that location. Point it at the folder that holds the extracted package, or at a parent folder with Include subfolders checked.' } },
    ] },
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-update', type: 'link', label: 'Windows Update', screen: 'windows-update' },
    ] },
    { id: 'windows-update', app: 'settings', title: 'Windows Update', crumbs: ['Settings', 'Windows Update'], controls: [
      { id: 'update-status', type: 'info', text: "You're up to date" },
    ] },
  ],
  goals: [
    { id: 'open-devmgmt', text: 'Open Device Manager', check: { used: 'app:devmgmt' },
      why: 'Device Manager is the Windows console that shows every device, its status and its driver. Hardware that "does not show up" starts here.',
      expect: 'Device Manager is open, from Start search (device manager) or the Run box (devmgmt.msc).',
      hints: ['Hardware and driver problems live in one Windows console that lists every device by type.', 'Open Device Manager from Start search or the Run box.', 'Press Windows+R, type devmgmt.msc and press Enter.'],
      src: ['usingDevmgr', 'openDevmgr'] },
    { id: 'read-status', text: "Read the adapter's Device status", check: { used: 'screen:serial-props' },
      why: 'Identify the problem before changing anything. The status code tells you which fix applies: Code 28 means the drivers are not installed, so the fix is a driver, not new hardware.',
      expect: 'You opened Properties for USB-Serial Controller under Other devices and read: The drivers for this device are not installed. (Code 28)',
      hints: ['This adapter appears under Other devices with a warning icon. Its Properties show the problem code.', 'Open the Properties of USB-Serial Controller under Other devices and read Device status.', 'In Device Manager, right-click Other devices > USB-Serial Controller > Properties, and read Device status on the General tab.'],
      src: ['usingDevmgr', 'errorCodes', 'code28'] },
    { id: 'install-driver', text: 'Install the adapter driver from the extracted package', check: { all: [{ key: 'serial.status', op: 'eq', value: WORKING }, { key: 'serial.present', op: 'truthy' }] },
      why: 'Code 28 is fixed with the manufacturer driver. When you already have the package, Browse my computer for drivers points Windows straight at it; an automatic search finds nothing when Windows Update does not offer a driver for the device.',
      expect: `The adapter shows as USB Serial Port (COM3) under Ports (COM & LPT) with status ${WORKING}`,
      hints: ['The status says the driver is missing, and the driver files are already on this PC.', `Use Update driver and point Windows at ${DRIVER_FOLDER}.`, `Right-click USB-Serial Controller > Update driver > Browse my computer for drivers > choose ${DRIVER_FOLDER} > Next.`],
      src: ['updateDrivers', 'code28'] },
  ],
  traps: [
    { id: 'hub-disabled', check: { key: 'hub.status', op: 'eq', value: 'This device is disabled. (Code 22)' },
      message: 'You disabled USB Root Hub (USB 3.0). Devices connected through that hub stop working; a USB keyboard or mouse on it could disconnect. The adapter still needs a driver. Re-enable the hub, then update the adapter driver.',
      why: 'Change only the device that reports the problem. A controller whose status is This device is working properly is not the fault.',
      src: ['code22', 'usingDevmgr'] },
  ],
  solution: [
    { do: { type: 'launch', query: 'devmgmt.msc' }, explain: 'Run devmgmt.msc (Windows+R) to open Device Manager, the console that lists every device and its status.' },
    { do: { type: 'act', controlId: 'devices', rowId: 'serial', actionId: 'properties' }, explain: 'Open Properties for USB-Serial Controller under Other devices. Device status reads Code 28: the drivers for this device are not installed.' },
    { do: { type: 'act', controlId: 'props-update', rowId: null, actionId: null }, explain: 'On the Driver tab, select Update Driver. A driver problem gets a driver fix.' },
    { do: { type: 'act', controlId: 'browse', rowId: null, actionId: null }, explain: 'Choose Browse my computer for drivers, because the manufacturer package is already on this PC.' },
    { do: { type: 'set', controlId: 'path', value: DRIVER_FOLDER }, explain: `Point Windows at ${DRIVER_FOLDER}, where the package was extracted.` },
    { do: { type: 'act', controlId: 'next', rowId: null, actionId: null }, explain: 'Select Next. Windows installs the driver and the adapter moves to Ports (COM & LPT) as USB Serial Port (COM3).' },
  ],
  trapDemo: [
    { do: { type: 'launch', query: 'devmgmt.msc' } },
    { do: { type: 'act', controlId: 'devices', rowId: 'hub', actionId: 'disable' } },
  ],
  src: ['usingDevmgr', 'openDevmgr', 'updateDrivers', 'code28', 'code22'],
};

// win-02: Disk Management, new internal SSD.
const ARCHIVE = 'Archive (D:) NTFS Healthy';
const win02 = {
  id: 'win-02', title: 'Bring a new SSD online', level: 1, minutes: 7,
  scenario: 'Tomas at Lakeside Dental installed a second 1 TB NVMe SSD in RECEPTION-02 for scanned X-rays, but it does not show up in File Explorer. Disk 1 is the existing archive drive (D:), full of patient scans, and must not change. Set up the new SSD as one NTFS volume with drive letter S:, the letter the imaging software saves to.',
  examObjs: { 'aplus-1202': ['1.4'] }, objs: [],
  skin: 'windows',
  state: {
    'new.init': false, 'new.style': '', 'new.volume': false, 'new.letter': 'E', 'new.fs': 'NTFS', 'new.quick': true,
    'init.style': 'GPT', 'archive.volume': ARCHIVE, 'archive.wiped': false,
  },
  apps: [
    { id: 'diskmgmt', name: 'Disk Management', launch: ['diskmgmt.msc', 'disk management', 'create and format hard disk partitions'], icon: 'diskmgmt', home: 'disks' },
  ],
  screens: [
    { id: 'disks', app: 'diskmgmt', title: 'Disk Management', crumbs: ['RECEPTION-02'], controls: [
      { id: 'disks', type: 'list', label: 'Disks', rows: [
        { id: 'disk0', cells: ['Disk 0', 'Basic, Online', '476.81 GB', 'EFI System Partition | Local Disk (C:) NTFS Healthy | Recovery Partition'], actions: [] },
        { id: 'disk1', cells: ['Disk 1', 'Basic, Online', '1863.01 GB', '{{archive.volume}}'], actions: [
          { id: 'format', label: 'Format...', visibleIf: { key: 'archive.wiped', op: 'falsy' }, action: { set: { 'archive.wiped': true, 'archive.volume': 'Archive (D:) NTFS Healthy, now empty' }, msg: 'Archive (D:) was formatted. Every scan on it is gone.' } },
          { id: 'delete', label: 'Delete Volume...', visibleIf: { key: 'archive.wiped', op: 'falsy' }, action: { set: { 'archive.wiped': true, 'archive.volume': 'Unallocated' }, msg: 'The Archive (D:) volume was deleted. Every scan on it is gone.' } },
        ] },
        { id: 'disk2', visibleIf: { key: 'new.init', op: 'falsy' }, cells: ['Disk 2', 'Unknown, Not Initialized', '931.51 GB', 'Unallocated'], actions: [
          { id: 'initialize', label: 'Initialize Disk', action: { open: 'init-disk' } },
        ] },
        { id: 'disk2', visibleIf: { all: [{ key: 'new.init', op: 'truthy' }, { key: 'new.volume', op: 'falsy' }] }, cells: ['Disk 2', 'Basic, Online', '931.51 GB', 'Unallocated'], actions: [
          { id: 'new-simple', label: 'New Simple Volume...', action: { open: 'new-volume' } },
        ] },
        { id: 'disk2', visibleIf: { key: 'new.volume', op: 'truthy' }, cells: ['Disk 2', 'Basic, Online', '931.51 GB', 'New Volume ({{new.letter}}:) {{new.fs}} Healthy'], actions: [
          { id: 'change-letter', label: 'Change Drive Letter and Paths...', action: { open: 'change-letter' } },
        ] },
      ] },
      { id: 'rescan', type: 'button', label: 'Action > Rescan Disks', action: { msg: 'Disk Management rescanned the disks.' } },
    ] },
    { id: 'init-disk', app: 'diskmgmt', title: 'Initialize Disk', crumbs: ['RECEPTION-02', 'Disk 2'], controls: [
      { id: 'init-which', type: 'info', text: 'Selected disk: Disk 2 (931.51 GB)' },
      { id: 'init-style', type: 'select', label: 'Partition style', key: 'init.style', options: [{ value: 'GPT', label: 'GUID Partition Table (GPT)' }, { value: 'MBR', label: 'Master Boot Record (MBR)' }] },
      { id: 'init-ok', type: 'button', label: 'OK', visibleIf: is('init.style', 'GPT'), action: { set: { 'new.init': true, 'new.style': 'GPT' }, open: 'disks', msg: 'Disk 2 is initialized as GPT and shows Online with Unallocated space.' } },
      { id: 'init-ok-mbr', type: 'button', label: 'OK', visibleIf: is('init.style', 'MBR'), action: { set: { 'new.init': true, 'new.style': 'MBR' }, open: 'disks', msg: 'Disk 2 is initialized as MBR and shows Online with Unallocated space.' } },
      { id: 'init-cancel', type: 'link', label: 'Cancel', screen: 'disks' },
    ] },
    { id: 'new-volume', app: 'diskmgmt', title: 'New Simple Volume Wizard', crumbs: ['RECEPTION-02', 'Disk 2'], controls: [
      { id: 'size', type: 'info', text: 'Simple volume size: the default, which uses the entire disk.' },
      { id: 'letter', type: 'select', label: 'Assign the following drive letter', key: 'new.letter', options: ['E', 'F', 'G', 'S'] },
      { id: 'fs', type: 'select', label: 'File system', key: 'new.fs', options: ['NTFS', 'exFAT'] },
      { id: 'quick', type: 'toggle', label: 'Perform a quick format', key: 'new.quick' },
      { id: 'finish', type: 'button', label: 'Finish', action: { set: { 'new.volume': true }, open: 'disks', msg: 'Disk 2 now holds New Volume ({{new.letter}}:), formatted {{new.fs}}. It appears in File Explorer under that letter.' } },
      { id: 'wizard-cancel', type: 'link', label: 'Cancel', screen: 'disks' },
    ] },
    { id: 'change-letter', app: 'diskmgmt', title: 'Change Drive Letter and Paths for New Volume', crumbs: ['RECEPTION-02', 'Disk 2'], controls: [
      { id: 'change-to', type: 'select', label: 'Assign the following drive letter', key: 'new.letter', options: ['E', 'F', 'G', 'S'] },
      { id: 'change-ok', type: 'link', label: 'OK', screen: 'disks' },
    ] },
  ],
  goals: [
    { id: 'open-diskmgmt', text: 'Open Disk Management', check: { used: 'app:diskmgmt' },
      why: 'A disk that Windows sees but File Explorer does not is a Disk Management job: that console shows every disk, its status and its volumes, even before the disk is usable.',
      expect: 'Disk Management is open, from the Run box (diskmgmt.msc), right-click Start > Disk Management, or Start search.',
      hints: ['New disks that are missing from File Explorer are set up in the console that manages disks and volumes.', 'Open Disk Management from right-click Start or the Run box.', 'Press Windows+R, type diskmgmt.msc and press Enter.'],
      src: ['createPartition', 'troubleshootDisk'] },
    { id: 'init-gpt', text: 'Initialize the new disk (Disk 2) with a supported partition style', check: { all: [{ key: 'new.init', op: 'truthy' }, { key: 'new.style', op: 'in', value: ['GPT', 'MBR'] }] },
      why: 'A new disk needs a partition style before it can hold a volume. GPT is the recommended default for a modern Windows PC, while MBR also supports this 1 TB data disk. Confirm the empty disk by its 931.51 GB size and Not Initialized status before changing it.',
      expect: 'Disk 2 (931.51 GB) shows Basic, Online, after Initialize Disk. GUID Partition Table (GPT) is the default and the usual choice; MBR also works for a data disk of 2 TB or less.',
      hints: ['Look for the disk whose status says it is not ready yet, with a size that matches the new 1 TB SSD.', 'Right-click Disk 2 (Not Initialized) and initialize it. Keep the default GPT partition style unless you have a reason to use MBR.', 'Right-click Disk 2 > Initialize Disk > keep GUID Partition Table (GPT) > OK.'],
      src: ['initDisk', 'over2tb', 'troubleshootDisk'] },
    { id: 'ntfs-volume', text: 'Create one NTFS volume on the new disk', check: { all: [{ key: 'new.volume', op: 'truthy' }, is('new.fs', 'NTFS')] },
      why: 'Initializing only prepares the disk. Files live in a formatted volume, and NTFS is the standard Windows file system for internal drives (permissions, large files, journaling).',
      expect: 'Disk 2 shows New Volume formatted NTFS, Healthy, using the whole disk.',
      hints: ['After initializing, the space on the disk is still not usable by File Explorer.', 'Right-click the Unallocated space on Disk 2 and create a simple volume formatted NTFS.', 'Right-click Disk 2 Unallocated > New Simple Volume > keep the full size > drive letter > File system NTFS > Finish.'],
      src: ['initDisk', 'createPartition'] },
    { id: 'letter-s', text: 'Give the new volume drive letter S:', check: { all: [{ key: 'new.volume', op: 'truthy' }, is('new.letter', 'S')] },
      why: 'File Explorer and apps reach a volume through its drive letter. The wizard offers the next free letter (E:), so read the requirement: the imaging software saves to S:. You can also fix a letter later with Change Drive Letter and Paths.',
      expect: 'The new volume shows as New Volume (S:).',
      hints: ['The ticket names the letter the imaging software expects.', 'In the New Simple Volume Wizard, change the drive letter from the default to S.', 'In the wizard set Assign the following drive letter to S (or right-click the new volume > Change Drive Letter and Paths and choose S).'],
      src: ['driveLetter', 'createPartition'] },
  ],
  traps: [
    { id: 'archive-wiped', critical: true, check: { key: 'archive.wiped', op: 'truthy' },
      message: 'You formatted or deleted the volume on Disk 1, the existing Archive (D:) drive. Formatting or deleting a volume erases its data, so every patient scan on it is gone and must come back from backup. The new SSD is the disk listed as Not Initialized.',
      why: 'Before you initialize, format or delete anything in Disk Management, confirm the disk by status, size and contents. A Healthy volume with a drive letter is in use; a new disk shows Not Initialized and Unallocated.',
      src: ['troubleshootDisk', 'initDisk'] },
  ],
  solution: [
    launch('diskmgmt.msc', 'Open Disk Management (Windows+R, diskmgmt.msc). Disk 2, 931.51 GB, shows Unknown, Not Initialized: that is the new SSD. Disk 1 is the archive with a Healthy D: volume.'),
    act('disks', 'disk2', 'initialize', 'Right-click Disk 2 > Initialize Disk. Only the new disk is selected.'),
    act('init-ok', null, null, 'Keep GUID Partition Table (GPT), the default for internal drives, and select OK (MBR would also work for this 1 TB data disk). Disk 2 turns Basic, Online.'),
    act('disks', 'disk2', 'new-simple', 'Right-click the Unallocated space on Disk 2 > New Simple Volume and keep the default size, the whole disk.'),
    set('letter', 'S', 'Change the drive letter from the offered E to S, the letter the imaging software uses.'),
    act('finish', null, null, 'Keep File system NTFS and quick format, and select Finish. New Volume (S:) appears in Disk Management and File Explorer.'),
  ],
  trapDemo: [
    launch('diskmgmt.msc'),
    act('disks', 'disk1', 'format'),
  ],
  src: ['initDisk', 'over2tb', 'createPartition', 'driveLetter', 'troubleshootDisk', 'diskOverview'],
};

// win-03: Event Viewer + Reliability Monitor for an app that crashes at launch.
const EVENT_1000 = [
  ['Log Name:', 'Application'], ['Source:', 'Application Error'], ['Event ID:', '1000'], ['Level:', 'Error'],
  ['Task Category:', 'Application Crashing Events'], ['User:', 'SYSTEM'], ['Computer:', 'FRONT-03.pinecrest.example'],
  ['Faulting application name:', 'listingdesk.exe, version: 8.4.0.0'],
  ['Faulting module name:', 'pdfpreview64.dll, version: 2.1.0.0'],
  ['Exception code:', '0xc0000005'],
  ['Faulting application path:', 'C:\\Program Files\\Contoso\\ListingDesk\\listingdesk.exe'],
  ['Faulting module path:', 'C:\\Program Files\\Fabrikam\\PDF Preview\\pdfpreview64.dll'],
];
const win03 = {
  id: 'win-03', title: 'Find why an app crashes at launch', level: 2, minutes: 9,
  scenario: 'At Larkhollow Realty, Contoso ListingDesk closes the moment it opens on FRONT-03, every time since Tuesday 10/6/2026. Before anyone reinstalls, find the crash record (source, Event ID and faulting module) and confirm the pattern in the stability history. The office manager approved removing anything installed this week that the evidence points to.',
  examObjs: { 'aplus-1202': ['1.4', '3.1'] }, objs: [],
  skin: 'windows',
  state: { 'log.cleared': false, 'app.installed': true, 'addin.installed': true, 'scanutil.installed': true, 'app.verified': false },
  apps: [
    { id: 'eventvwr', name: 'Event Viewer', launch: ['eventvwr.msc', 'eventvwr', 'event viewer'], icon: 'eventvwr', home: 'ev-home' },
    { id: 'reliability', name: 'Reliability Monitor', launch: ['perfmon /rel', 'reliability monitor'], icon: 'reliability', home: 'rel' },
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:appsfeatures', screen: 'installed-apps' }], icon: 'settings', home: 'settings-home' },
    { id: 'listingdesk', name: 'Contoso ListingDesk', launch: ['listingdesk', 'listingdesk.exe'], home: 'ld' },
  ],
  screens: [
    { id: 'ld', app: 'listingdesk', title: 'Contoso ListingDesk', crumbs: ['Contoso ListingDesk'], controls: [
      { id: 'ld-missing', type: 'info', visibleIf: { key: 'app.installed', op: 'falsy' }, text: 'Contoso ListingDesk is not installed on this PC.' },
      { id: 'ld-crash', type: 'info', visibleIf: { all: [{ key: 'app.installed', op: 'truthy' }, { key: 'addin.installed', op: 'truthy' }] }, text: 'ListingDesk closed the moment it opened, the same crash as before.' },
      { id: 'ld-ok', type: 'info', visibleIf: { all: [{ key: 'app.installed', op: 'truthy' }, { key: 'addin.installed', op: 'falsy' }] }, text: 'ListingDesk opened and shows the Listings dashboard.' },
      { id: 'ld-open-listing', type: 'button', label: 'Open a listing', visibleIf: { all: [{ key: 'app.installed', op: 'truthy' }, { key: 'addin.installed', op: 'falsy' }] },
        action: { set: { 'app.verified': true }, msg: 'The listing opened and ListingDesk stayed open. The fix is confirmed.' } },
    ] },
    { id: 'ev-home', app: 'eventvwr', title: 'Event Viewer (Local)', crumbs: ['Event Viewer (Local)'], controls: [
      { id: 'nav-application', type: 'link', label: 'Windows Logs > Application', screen: 'ev-app' },
      { id: 'nav-system', type: 'link', label: 'Windows Logs > System', screen: 'ev-sys' },
    ] },
    { id: 'ev-app', app: 'eventvwr', title: 'Application', crumbs: ['Event Viewer (Local)', 'Windows Logs', 'Application'], controls: [
      { id: 'events', type: 'list', label: 'Level | Date and Time | Source | Event ID | Task Category', visibleIf: { key: 'log.cleared', op: 'falsy' }, rows: [
        { id: 'e-0808', cells: ['Error', '10/8/2026 8:02:14 AM', 'Application Error', '1000', 'Application Crashing Events'], actions: [{ id: 'open', label: 'Event Properties', action: { open: 'ev-1000' } }] },
        { id: 'e-0808-wer', cells: ['Information', '10/8/2026 8:02:16 AM', 'Windows Error Reporting', '1001', 'None'], actions: [{ id: 'open', label: 'Event Properties', action: { open: 'ev-1001' } }] },
        { id: 'e-0707', cells: ['Error', '10/7/2026 9:15:40 AM', 'Application Error', '1000', 'Application Crashing Events'], actions: [{ id: 'open', label: 'Event Properties', action: { open: 'ev-1000' } }] },
      ] },
      { id: 'empty', type: 'info', visibleIf: { key: 'log.cleared', op: 'truthy' }, text: 'Application: Number of events: 0' },
      { id: 'clear-log', type: 'button', label: 'Actions > Clear Log...', action: { set: { 'log.cleared': true }, msg: 'The Application log was cleared. Its events, including the crash records, are gone.' } },
      { id: 'app-back', type: 'link', label: 'Event Viewer (Local)', screen: 'ev-home' },
    ] },
    { id: 'ev-sys', app: 'eventvwr', title: 'System', crumbs: ['Event Viewer (Local)', 'Windows Logs', 'System'], controls: [
      { id: 'sys-events', type: 'list', label: 'Level | Date and Time | Source | Event ID | Task Category', rows: [
        { id: 's-1', cells: ['Information', '10/8/2026 7:58:02 AM', 'Microsoft-Windows-Kernel-General', '12', 'None'], actions: [] },
      ] },
      { id: 'sys-back', type: 'link', label: 'Event Viewer (Local)', screen: 'ev-home' },
    ] },
    { id: 'ev-1000', app: 'eventvwr', title: 'Event 1000, Application Error', crumbs: ['Application', 'Event 1000'], controls: [
      { id: 'general-1000', type: 'info', label: 'General', values: EVENT_1000 },
      { id: 'close-1000', type: 'link', label: 'Close', screen: 'ev-app' },
    ] },
    { id: 'ev-1001', app: 'eventvwr', title: 'Event 1001, Windows Error Reporting', crumbs: ['Application', 'Event 1001'], controls: [
      { id: 'general-1001', type: 'info', label: 'General', values: [['Log Name:', 'Application'], ['Source:', 'Windows Error Reporting'], ['Event ID:', '1001'], ['Level:', 'Information'], ['Description:', 'Windows Error Reporting report for listingdesk.exe']] },
      { id: 'close-1001', type: 'link', label: 'Close', screen: 'ev-app' },
    ] },
    { id: 'rel', app: 'reliability', title: 'Reliability Monitor', crumbs: ['Reliability Monitor'], controls: [
      { id: 'index', type: 'info', text: 'Stability Index: 10 until 10/5/2026, falling every day since 10/6/2026.' },
      { id: 'rel-events', type: 'list', label: 'Date | Category | Item | Result', rows: [
        { id: 'r-install', cells: ['10/6/2026 7:41 AM', 'Software (Un)Installs', 'Fabrikam PDF Preview 2.1.0.0', 'Install: Success'], actions: [] },
        { id: 'r-fail-06', cells: ['10/6/2026 8:05 AM', 'Application failures', 'listingdesk.exe', 'Stopped working'], actions: [{ id: 'details', label: 'View technical details', action: { open: 'rel-detail' } }] },
        { id: 'r-fail-07', cells: ['10/7/2026 9:15 AM', 'Application failures', 'listingdesk.exe', 'Stopped working'], actions: [{ id: 'details', label: 'View technical details', action: { open: 'rel-detail' } }] },
        { id: 'r-fail-08', cells: ['10/8/2026 8:02 AM', 'Application failures', 'listingdesk.exe', 'Stopped working'], actions: [{ id: 'details', label: 'View technical details', action: { open: 'rel-detail' } }] },
      ] },
    ] },
    { id: 'rel-detail', app: 'reliability', title: 'Problem details: listingdesk.exe', crumbs: ['Reliability Monitor', 'listingdesk.exe'], controls: [
      { id: 'rel-info', type: 'info', values: [['Application:', 'listingdesk.exe'], ['Version:', '8.4.0.0'], ['Failure Type:', 'Stopped working'], ['Faulting module:', 'pdfpreview64.dll'], ['First failure:', '10/6/2026, 24 minutes after Fabrikam PDF Preview was installed']] },
      { id: 'rel-back', type: 'link', label: 'Back to Reliability Monitor', screen: 'rel' },
    ] },
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-installed', type: 'link', label: 'Apps > Installed apps', screen: 'installed-apps' },
    ] },
    { id: 'installed-apps', app: 'settings', title: 'Installed apps', crumbs: ['Settings', 'Apps', 'Installed apps'], controls: [
      { id: 'apps', type: 'list', label: 'Installed apps', rows: [
        { id: 'listingdesk', visibleIf: { key: 'app.installed', op: 'truthy' }, cells: ['Contoso ListingDesk', '8.4.0.0', 'Contoso Ltd', 'Installed 3/12/2026'], actions: [{ id: 'uninstall', label: 'More > Uninstall', action: { set: { 'app.installed': false }, msg: 'Contoso ListingDesk was uninstalled.' } }] },
        { id: 'pdfpreview', visibleIf: { key: 'addin.installed', op: 'truthy' }, cells: ['Fabrikam PDF Preview', '2.1.0.0', 'Fabrikam, Inc.', 'Installed 10/6/2026'], actions: [{ id: 'uninstall', label: 'More > Uninstall', action: { set: { 'addin.installed': false }, msg: 'Fabrikam PDF Preview was uninstalled.' } }] },
        { id: 'scanutil', visibleIf: { key: 'scanutil.installed', op: 'truthy' }, cells: ['Fabrikam Scan Utility', '5.0.2', 'Fabrikam, Inc.', 'Installed 1/20/2026'], actions: [{ id: 'uninstall', label: 'More > Uninstall', action: { set: { 'scanutil.installed': false }, msg: 'Fabrikam Scan Utility was uninstalled.' } }] },
      ] },
    ] },
  ],
  goals: [
    { id: 'app-log', text: 'Open the Application log in Event Viewer', check: { used: 'screen:ev-app' },
      why: 'Application crashes are recorded in Windows Logs > Application. Reading the log first turns "it just closes" into evidence you can act on.',
      expect: 'Event Viewer is open on Windows Logs > Application.',
      hints: ['Windows writes a record every time an application crashes. Find the console that keeps those records.', 'Open Event Viewer and go to Windows Logs > Application.', 'Press Windows+R, type eventvwr.msc, then select Windows Logs > Application.'],
      src: ['eventViewer', 'appCrash'] },
    { id: 'read-1000', text: 'Read the crash event: source, Event ID and faulting module', check: { used: 'screen:ev-1000' },
      why: 'The Error event from source Application Error with Event ID 1000 is the crash itself. Its description names the faulting application and the faulting module. Here the module is pdfpreview64.dll from a Fabrikam folder, not a ListingDesk file.',
      expect: 'You opened the Error event: Source Application Error, Event ID 1000, faulting application listingdesk.exe, faulting module pdfpreview64.dll.',
      hints: ['Look for an Error level event at the time of a crash, not the Information events.', 'Open the Application Error event with Event ID 1000 and read the faulting module name.', 'In Windows Logs > Application, open the Error from source Application Error, Event ID 1000 (10/8/2026 8:02:14 AM) and read Faulting module name: pdfpreview64.dll.'],
      src: ['appCrash'] },
    { id: 'rel-pattern', text: 'Confirm the pattern in Reliability Monitor', check: { used: 'screen:rel-detail' },
      why: 'Reliability Monitor puts failures and software installs on one timeline. ListingDesk worked until 10/6/2026 and has failed every day since, starting minutes after Fabrikam PDF Preview was installed. A repeat pattern that lines up with a change is your theory of probable cause.',
      expect: 'You opened Reliability Monitor (perfmon /rel) and the technical details of a listingdesk.exe failure, next to the 10/6/2026 Fabrikam PDF Preview install.',
      hints: ['There is a tool that shows failures and software installs day by day on one chart.', 'Open Reliability Monitor and look at the Application failures since 10/6/2026.', 'Press Windows+R, type perfmon /rel, then select a listingdesk.exe Stopped working entry > View technical details.'],
      src: ['perfmonCmd', 'reliability'] },
    { id: 'remove-addin', text: 'Remove the add-in the evidence points to, keep ListingDesk, and confirm ListingDesk now stays open', check: { all: [{ key: 'addin.installed', op: 'falsy' }, { key: 'app.installed', op: 'truthy' }, { key: 'app.verified', op: 'truthy' }] },
      why: 'The faulting module belongs to Fabrikam PDF Preview and the crashes began right after it was installed, so remove that recent change first: it is the smallest change that tests the theory. A faulting module is strong evidence, not proof, so launch ListingDesk afterward and confirm it stays open before you call it fixed. Reinstalling ListingDesk would not touch the add-in. Send the Event 1000 details to the add-in vendor before putting it back.',
      expect: 'Fabrikam PDF Preview is uninstalled from Settings > Apps > Installed apps, Contoso ListingDesk is still installed, and ListingDesk opens a listing without closing.',
      hints: ['The module that crashes is not part of ListingDesk itself. Which product installed this week owns it? After the change, test the app.', 'Uninstall Fabrikam PDF Preview from Settings > Apps > Installed apps, then launch ListingDesk and open a listing.', 'Start > Settings > Apps > Installed apps > Fabrikam PDF Preview > More > Uninstall. Then Start search listingdesk > Open a listing.'],
      src: ['uninstallApps', 'reliability', 'appCrash'] },
  ],
  traps: [
    { id: 'cleared-log', check: { key: 'log.cleared', op: 'truthy' },
      message: 'You cleared the Application log. Clearing deletes its events, so the crash records you needed (and anything else in that log) are gone. If a log really must be cleared, save it first.',
      why: 'Read and save evidence; never destroy it while you investigate.',
      src: ['wevtutil', 'appCrash'] },
    { id: 'removed-wrong-app', check: { any: [{ key: 'app.installed', op: 'falsy' }, { key: 'scanutil.installed', op: 'falsy' }] },
      message: 'You uninstalled an app that is not the cause. The faulting module is pdfpreview64.dll from Fabrikam PDF Preview, installed 10/6/2026. Removing ListingDesk takes away the app the office needs, and Fabrikam Scan Utility has nothing to do with the crash.',
      why: 'Act on what the evidence names: the faulting module and the change that lines up with the first failure.',
      src: ['appCrash', 'uninstallApps'] },
  ],
  solution: [
    launch('eventvwr.msc', 'Open Event Viewer (Windows+R, eventvwr.msc).'),
    act('nav-application', null, null, 'Go to Windows Logs > Application, where application crashes are logged.'),
    act('events', 'e-0808', 'open', 'Open the Error from source Application Error, Event ID 1000. Faulting application: listingdesk.exe; faulting module: pdfpreview64.dll in C:\\Program Files\\Fabrikam\\PDF Preview.'),
    launch('perfmon /rel', 'Open Reliability Monitor (perfmon /rel). Application failures for listingdesk.exe appear every day since 10/6/2026, the day Fabrikam PDF Preview was installed.'),
    act('rel-events', 'r-fail-06', 'details', 'View technical details of the first failure: same faulting module, 24 minutes after the add-in install.'),
    launch('ms-settings:appsfeatures', 'Open Settings > Apps > Installed apps.'),
    act('apps', 'pdfpreview', 'uninstall', 'Uninstall Fabrikam PDF Preview, then launch ListingDesk and confirm it stays open. If it still crashes, keep the Event 1000 details and continue investigating before calling the fault fixed.'),
    launch('listingdesk', 'Launch ListingDesk from Start search. It opens on the Listings dashboard instead of closing.'),
    act('ld-open-listing', null, null, 'Open a listing: ListingDesk stays open, so the theory is confirmed. Send the Event 1000 details to Fabrikam before anyone reinstalls the add-in.'),
  ],
  trapDemo: [
    launch('eventvwr.msc'),
    act('nav-application'),
    act('clear-log'),
    launch('ms-settings:appsfeatures'),
    act('apps', 'listingdesk', 'uninstall'),
  ],
  src: ['appCrash', 'eventViewer', 'perfmonCmd', 'reliability', 'uninstallApps', 'wevtutil'],
};

// win-04: Services, Print Spooler stopped and Disabled.
const SPOOLER_DESC = "This service spools print jobs and handles interaction with the printer. If you turn off this service, you can't print or see your printers.";
const NOTIFY_DESC = "This service opens custom printer dialog boxes and handles notifications from a remote print server or a printer. If you turn off this service, you can't see printer extensions or notifications.";
const STARTUP_TYPES = ['Automatic (Delayed Start)', 'Automatic', 'Manual', 'Disabled'];
const applyButtons = STARTUP_TYPES.map((type) => ({
  id: `apply-${type.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}`, type: 'button', label: 'Apply',
  visibleIf: is('spool.pending', type), action: { set: { 'spool.start': type }, msg: `Startup type saved: ${type}.` },
}));
const win04 = {
  id: 'win-04', title: 'Printing stopped after a service change', level: 2, minutes: 7,
  scenario: 'Nobody can print from ACCT-04 at Bayview Accounting, and Settings > Bluetooth & devices > Printers & scanners shows no printers. Yesterday another technician set a service to Disabled while chasing a different problem. Get printing back so it survives the next restart, and check that the printers are back.',
  examObjs: { 'aplus-1202': ['1.4', '3.1'] }, objs: [],
  skin: 'windows',
  state: {
    'spool.status': 'Stopped', 'spool.col': '', 'spool.start': 'Disabled', 'spool.pending': 'Disabled',
    'notify.status': 'Stopped', 'notify.col': '', 'test.printed': false,
  },
  apps: [
    { id: 'services', name: 'Services', launch: ['services.msc', 'services'], icon: 'services', home: 'services' },
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:printers', screen: 'printers' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'services', app: 'services', title: 'Services (Local)', crumbs: ['Services (Local)'], controls: [
      { id: 'svc', type: 'list', label: 'Name | Description | Status | Startup Type', rows: [
        { id: 'notify', cells: ['Printer Extensions and Notifications', NOTIFY_DESC, '{{notify.col}}', 'Manual'], actions: [
          { id: 'start', label: 'Start', visibleIf: is('notify.status', 'Stopped'), action: { set: { 'notify.status': 'Running', 'notify.col': 'Running' }, msg: 'Printer Extensions and Notifications started.' } },
          { id: 'restart', label: 'Restart', visibleIf: is('notify.status', 'Running'), action: { msg: 'Printer Extensions and Notifications restarted.' } },
        ] },
        { id: 'spooler', cells: ['Print Spooler', SPOOLER_DESC, '{{spool.col}}', '{{spool.start}}'], actions: [
          { id: 'properties', label: 'Properties', action: { open: 'spooler-props' } },
          { id: 'start', label: 'Start', visibleIf: is('spool.status', 'Stopped'), disabledIf: is('spool.start', 'Disabled'), action: { set: { 'spool.status': 'Running', 'spool.col': 'Running' }, msg: 'Print Spooler started.' } },
          { id: 'restart', label: 'Restart', visibleIf: is('spool.status', 'Running'), action: { msg: 'Print Spooler restarted.' } },
        ] },
        { id: 'wuauserv', cells: ['Windows Update', 'Enables the detection, download, and installation of updates for Windows and other programs.', '', 'Manual'], actions: [] },
      ] },
    ] },
    { id: 'spooler-props', app: 'services', title: 'Print Spooler Properties (Local Computer)', crumbs: ['Services (Local)', 'Print Spooler'], controls: [
      { id: 'general', type: 'info', label: 'General', values: [['Service name:', 'Spooler'], ['Display name:', 'Print Spooler'], ['Description:', SPOOLER_DESC], ['Service status:', '{{spool.status}}']] },
      { id: 'startup-type', type: 'select', label: 'Startup type:', key: 'spool.pending', options: STARTUP_TYPES },
      ...applyButtons,
      { id: 'start', type: 'button', label: 'Start', visibleIf: is('spool.status', 'Stopped'), disabledIf: is('spool.start', 'Disabled'), action: { set: { 'spool.status': 'Running', 'spool.col': 'Running' }, msg: 'Print Spooler started. Service status: Running.' } },
      { id: 'stop', type: 'button', label: 'Stop', visibleIf: is('spool.status', 'Running'), action: { set: { 'spool.status': 'Stopped', 'spool.col': '' }, msg: 'Print Spooler stopped.' } },
      { id: 'ok', type: 'link', label: 'OK', screen: 'services' },
    ] },
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-printers', type: 'link', label: 'Bluetooth & devices > Printers & scanners', screen: 'printers' },
    ] },
    { id: 'printers', app: 'settings', title: 'Printers & scanners', crumbs: ['Settings', 'Bluetooth & devices', 'Printers & scanners'], controls: [
      { id: 'printer-list', type: 'list', label: 'Printers & scanners', visibleIf: is('spool.status', 'Running'), rows: [
        { id: 'mfp', cells: ['Bayview Front Office MFP', 'Default'], actions: [{ id: 'properties', label: 'Printer properties', action: { open: 'mfp-props' } }] },
        { id: 'pdf', cells: ['Microsoft Print to PDF', ''], actions: [] },
      ] },
      { id: 'no-printers', type: 'info', visibleIf: { not: is('spool.status', 'Running') }, text: 'No printers or scanners are listed.' },
    ] },
    { id: 'mfp-props', app: 'settings', title: 'Bayview Front Office MFP Properties', crumbs: ['Printers & scanners', 'Bayview Front Office MFP', 'Printer properties'], controls: [
      { id: 'mfp-general', type: 'info', label: 'General', values: [['Printer:', 'Bayview Front Office MFP'], ['Location:', 'Front office']] },
      { id: 'test-page', type: 'button', label: 'Print Test Page', visibleIf: is('spool.status', 'Running'),
        action: { set: { 'test.printed': true }, msg: 'The test page printed on Bayview Front Office MFP.' } },
      { id: 'test-page-off', type: 'button', label: 'Print Test Page', visibleIf: { not: is('spool.status', 'Running') },
        action: { msg: 'The test page could not be sent: the Print Spooler service is not running.' } },
      { id: 'mfp-ok', type: 'link', label: 'OK', screen: 'printers' },
    ] },
  ],
  goals: [
    { id: 'startup-auto', text: 'Set Print Spooler startup type to Automatic', check: { key: 'spool.start', op: 'in', value: ['Automatic', 'Automatic (Delayed Start)'] },
      why: 'A Disabled service cannot be started by a user or an application, and a service that only runs until the next restart is not fixed. Automatic, the Windows default for Print Spooler, starts it at every system startup. Automatic (Delayed Start) also starts it after every restart, shortly after the other automatic services, so it fixes the ticket too.',
      expect: 'Print Spooler shows Startup Type Automatic (or Automatic (Delayed Start)) in Services.',
      hints: ['Printing and the printer list both depend on one Windows service. Find it in the console that manages services.', 'In services.msc open Print Spooler Properties and change its startup type, then apply it.', 'services.msc > right-click Print Spooler > Properties > Startup type: Automatic > Apply.'],
      src: ['serviceList', 'serviceStartup', 'setService'] },
    { id: 'running', text: 'Start the Print Spooler service', check: is('spool.status', 'Running'),
      why: 'Changing the startup type does not start the service now. Start it so the user can print today; Start stays unavailable until the Disabled setting is changed and applied.',
      expect: 'Print Spooler Service status: Running.',
      hints: ['After the startup type is fixed, the service is still stopped.', 'Use the Start button in Print Spooler Properties (or right-click Print Spooler > Start).', 'In Print Spooler Properties, after Apply, select Start under Service status.'],
      src: ['spoolerNotRunning', 'serviceStartup'] },
    { id: 'verify', text: 'Check that the printers are listed again and a test page prints', check: { all: [{ used: 'screen:printers' }, is('spool.status', 'Running'), { key: 'test.printed', op: 'truthy' }] },
      why: 'Verify full system functionality before closing the ticket. With the spooler running, Settings lists the printers again, and a test page proves Windows can actually send a job to the printer. If it does not print, keep troubleshooting the printer or its driver.',
      expect: 'Printers & scanners lists Bayview Front Office MFP, and a test page from that printer completes.',
      hints: ['The ticket said nobody can print and the printer list in Settings was empty. Check both.', 'Open Settings > Bluetooth & devices > Printers & scanners, select the MFP and print a test page.', 'Press Windows+R, type ms-settings:printers, select Bayview Front Office MFP > Printer properties > General tab > Print Test Page.'],
      src: ['addPrinter', 'testPage', 'serviceList'] },
  ],
  traps: [
    { id: 'wrong-service', check: is('notify.status', 'Running'),
      message: 'You started Printer Extensions and Notifications. That service shows custom printer dialogs and notifications; it does not spool print jobs, so printing is still broken and you changed a second service for nothing. The service that queues print jobs is Print Spooler (service name Spooler).',
      why: 'Read the service description and change only the service that matches the symptom.',
      src: ['serviceList'] },
  ],
  solution: [
    launch('services.msc', 'Open Services (Windows+R, services.msc). Print Spooler shows Startup Type Disabled and no status: it is stopped.'),
    act('svc', 'spooler', 'properties', 'Open Print Spooler Properties. The description says that without this service you cannot print or see your printers.'),
    set('startup-type', 'Automatic', 'Set Startup type to Automatic, the Windows default for this service.'),
    act('apply-automatic', null, null, 'Select Apply. Start becomes available once the service is no longer Disabled.'),
    act('start', null, null, 'Select Start. Service status: Running.'),
    launch('ms-settings:printers', 'Open Settings > Bluetooth & devices > Printers & scanners: the printers are listed again.'),
    act('printer-list', 'mfp', 'properties', 'Select Bayview Front Office MFP > Printer properties.'),
    act('test-page', null, null, 'On the General tab select Print Test Page. The page prints, so printing really works again.'),
  ],
  trapDemo: [
    launch('services.msc'),
    act('svc', 'notify', 'start'),
  ],
  src: ['serviceList', 'serviceStartup', 'setService', 'spoolerNotRunning', 'addPrinter', 'testPage'],
};

// win-05: Startup apps.
const STARTUP = [
  { id: 'endpoint', name: 'Northwind Endpoint Protection', publisher: 'Northwind Traders', impact: 'High Impact' },
  { id: 'games', name: 'Tailspin Game Launcher', publisher: 'Tailspin Toys', impact: 'High Impact' },
  { id: 'photos', name: 'Contoso Photo Sync', publisher: 'Contoso Ltd', impact: 'High Impact' },
  { id: 'audio', name: 'Fabrikam Audio Console', publisher: 'Fabrikam, Inc.', impact: 'Low Impact' },
  { id: 'updater', name: 'Adventure Works Updater', publisher: 'Adventure Works Cycles', impact: 'Medium Impact' },
];
const startupKey = (id) => `su.${id}`;
const startupRows = STARTUP.flatMap((app) => {
  const present = app.id === 'endpoint' ? [{ key: 'endpoint.installed', op: 'truthy' }] : [];
  return [
    { id: app.id, visibleIf: { all: [...present, { key: startupKey(app.id), op: 'truthy' }] }, cells: [app.name, app.publisher, 'Enabled', app.impact],
      actions: [{ id: 'disable', label: 'Disable', action: { set: { [startupKey(app.id)]: false }, msg: `${app.name} will not start automatically at sign-in.` } }] },
    { id: app.id, visibleIf: { all: [...present, { key: startupKey(app.id), op: 'falsy' }] }, cells: [app.name, app.publisher, 'Disabled', 'None'],
      actions: [{ id: 'enable', label: 'Enable', action: { set: { [startupKey(app.id)]: true }, msg: `${app.name} will start automatically at sign-in.` } }] },
  ];
});
const win05 = {
  id: 'win-05', title: 'Speed up a slow sign-in', level: 2, minutes: 7,
  scenario: 'At Greenfield Library, the circulation laptop LT-22 takes minutes after sign-in before it responds. Ms. Ortiz says nobody uses the game launcher or the photo sync app on it. Library policy requires the Northwind Endpoint Protection agent on every PC. Cut the startup load without removing anything.',
  examObjs: { 'aplus-1202': ['1.4', '3.1'] }, objs: [],
  skin: 'windows',
  state: {
    'su.endpoint': true, 'su.games': true, 'su.photos': true, 'su.audio': true, 'su.updater': false,
    'endpoint.installed': true,
  },
  apps: [
    { id: 'taskmgr', name: 'Task Manager', launch: ['taskmgr', 'task manager', 'taskmgr.exe'], icon: 'taskmgr', home: 'tm-processes' },
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:startupapps', screen: 'settings-startup' }, { q: 'ms-settings:appsfeatures', screen: 'installed-apps' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'tm-processes', app: 'taskmgr', title: 'Task Manager', crumbs: ['Processes'], controls: [
      { id: 'cpu', type: 'info', values: [['CPU', '97%'], ['Disk', '100%']] },
      { id: 'nav-startup', type: 'link', label: 'Startup apps', screen: 'tm-startup' },
    ] },
    { id: 'tm-startup', app: 'taskmgr', title: 'Startup apps', crumbs: ['Task Manager', 'Startup apps'], controls: [
      { id: 'startup', type: 'list', label: 'Name | Publisher | Status | Startup impact', rows: startupRows },
      { id: 'nav-processes', type: 'link', label: 'Processes', screen: 'tm-processes' },
    ] },
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-apps-startup', type: 'link', label: 'Apps > Startup', screen: 'settings-startup' },
      { id: 'nav-installed', type: 'link', label: 'Apps > Installed apps', screen: 'installed-apps' },
    ] },
    { id: 'settings-startup', app: 'settings', title: 'Startup', crumbs: ['Settings', 'Apps', 'Startup'], controls: STARTUP.map((app) => ({
      id: `toggle-${app.id}`, type: 'toggle', label: `${app.name} (${app.impact})`, key: startupKey(app.id),
      ...(app.id === 'endpoint' ? { visibleIf: { key: 'endpoint.installed', op: 'truthy' } } : {}),
    })) },
    { id: 'installed-apps', app: 'settings', title: 'Installed apps', crumbs: ['Settings', 'Apps', 'Installed apps'], controls: [
      { id: 'apps', type: 'list', label: 'Installed apps', rows: [
        { id: 'endpoint', visibleIf: { key: 'endpoint.installed', op: 'truthy' }, cells: ['Northwind Endpoint Protection', 'Northwind Traders'], actions: [{ id: 'uninstall', label: 'More > Uninstall', action: { set: { 'endpoint.installed': false }, msg: 'Northwind Endpoint Protection was uninstalled.' } }] },
        { id: 'games', cells: ['Tailspin Game Launcher', 'Tailspin Toys'], actions: [] },
        { id: 'photos', cells: ['Contoso Photo Sync', 'Contoso Ltd'], actions: [] },
      ] },
    ] },
  ],
  goals: [
    { id: 'open-startup', text: 'Open the startup app list', check: { any: [{ used: 'screen:tm-startup' }, { used: 'screen:settings-startup' }] },
      why: 'Apps that launch at sign-in compete for CPU and disk right when the user wants to work. Task Manager > Startup apps lists them with a measured startup impact, so you fix the biggest load first instead of guessing.',
      expect: 'Task Manager > Startup apps (or Settings > Apps > Startup) is open.',
      hints: ['Slow sign-in is often caused by apps that start automatically. One tool lists them with their impact.', 'Open Task Manager and go to its Startup apps page.', 'Right-click Start > Task Manager (or run taskmgr) > Startup apps.'],
      src: ['startupApps'] },
    { id: 'games-off', text: 'Stop Tailspin Game Launcher from starting at sign-in', check: { key: 'su.games', op: 'falsy' },
      why: 'It is High Impact (more than 1 second of CPU or more than 3 MB of disk at startup) and nobody uses it on this PC. Disable prevents it from starting automatically; the app stays installed and can be re-enabled.',
      expect: 'Tailspin Game Launcher shows Status Disabled.',
      hints: ['Look at the Startup impact column for the apps the user said she does not need.', 'Disable Tailspin Game Launcher in Startup apps.', 'Task Manager > Startup apps > select Tailspin Game Launcher > Disable.'],
      src: ['startupApps'] },
    { id: 'photos-off', text: 'Stop Contoso Photo Sync from starting at sign-in', check: { key: 'su.photos', op: 'falsy' },
      why: 'Another High Impact app nobody needs at sign-in. Disabling it, not uninstalling it, keeps the change small and reversible.',
      expect: 'Contoso Photo Sync shows Status Disabled.',
      hints: ['There is a second unneeded High Impact app in the list.', 'Disable Contoso Photo Sync in Startup apps.', 'Task Manager > Startup apps > select Contoso Photo Sync > Disable.'],
      src: ['startupApps'] },
  ],
  traps: [
    { id: 'av-startup-off', critical: true, check: { all: [{ key: 'endpoint.installed', op: 'truthy' }, { key: 'su.endpoint', op: 'falsy' }] },
      message: "You disabled Northwind Endpoint Protection's startup entry. Library policy requires it enabled. Re-enable the entry and check the agent's protection status; do not assume a startup toggle alone proves whether its background protection is running.",
      why: 'Keep required security software enabled. Startup impact alone does not justify disabling a security entry.',
      src: ['startupApps'] },
    { id: 'av-uninstalled', critical: true, check: { key: 'endpoint.installed', op: 'falsy' },
      message: 'You uninstalled Northwind Endpoint Protection. The ticket asked to cut startup load without removing anything, and policy requires that agent; the laptop now has none of its protection until it is reinstalled.',
      why: 'Startup problems are fixed by disabling unneeded startup apps, which is reversible. Uninstalling security software is never part of a speed fix.',
      src: ['startupApps', 'uninstallApps'] },
  ],
  solution: [
    launch('taskmgr', 'Open Task Manager (right-click Start > Task Manager, or run taskmgr).'),
    act('nav-startup', null, null, 'Go to Startup apps. Three apps are High Impact: Northwind Endpoint Protection, Tailspin Game Launcher and Contoso Photo Sync.'),
    act('startup', 'games', 'disable', 'Disable Tailspin Game Launcher: High Impact and not used on this PC.'),
    act('startup', 'photos', 'disable', 'Disable Contoso Photo Sync for the same reason. Leave Northwind Endpoint Protection enabled: it is the required security agent.'),
  ],
  trapDemo: [
    launch('taskmgr'),
    act('nav-startup'),
    act('startup', 'endpoint', 'disable'),
    launch('ms-settings:appsfeatures'),
    act('apps', 'endpoint', 'uninstall'),
  ],
  src: ['startupApps', 'uninstallApps'],
};

// win-06: Local Users and Groups, Remote Desktop without admin rights.
// Accepts pmorales or DRAFT-11\\pmorales, any letter case, as the Select Users dialog does.
const PMORALES = `^\\s*(${exact('DRAFT-11').slice(4, -4)}\\\\)?${exact('pmorales').slice(4)}`;
const CEDARADMIN = `^\\s*(${exact('DRAFT-11').slice(4, -4)}\\\\)?${exact('cedaradmin').slice(4)}`;
const win06 = {
  id: 'win-06', title: 'Remote Desktop without admin rights', level: 2, minutes: 8,
  scenario: 'Priya Morales, a contractor at Cedar Hill Architects, needs to sign in to DRAFT-11 (Windows 11 Pro) with Remote Desktop using her local account pmorales. When the account was created it was put in Administrators by mistake. Turn on Remote Desktop and give her Remote Desktop access with no admin rights. The IT account cedaradmin must stay an administrator.',
  examObjs: { 'aplus-1202': ['1.4', '2.2'] }, objs: [],
  skin: 'windows',
  state: {
    'rd.on': false, 'adm.pmorales': true, 'adm.cedaradmin': true, 'rdu.pmorales': false, 'rdu.cedaradmin': false, 'sel.name': '', 'sel.admin': '',
  },
  apps: [
    { id: 'lusrmgr', name: 'Local Users and Groups', launch: ['lusrmgr.msc', 'computer management', 'compmgmt.msc'], icon: 'lusrmgr', home: 'lusr-users' },
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:remotedesktop', screen: 'remote-desktop' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'lusr-users', app: 'lusrmgr', title: 'Users', crumbs: ['Local Users and Groups (Local)', 'Users'], controls: [
      { id: 'users', type: 'list', label: 'Name | Full Name', rows: [
        { id: 'administrator', cells: ['Administrator', '(disabled)'], actions: [] },
        { id: 'cedaradmin', cells: ['cedaradmin', 'Cedar Hill IT'], actions: [] },
        { id: 'guest', cells: ['Guest', '(disabled)'], actions: [] },
        { id: 'pmorales', cells: ['pmorales', 'Priya Morales'], actions: [] },
      ] },
      { id: 'nav-groups', type: 'link', label: 'Groups', screen: 'lusr-groups' },
    ] },
    { id: 'lusr-groups', app: 'lusrmgr', title: 'Groups', crumbs: ['Local Users and Groups (Local)', 'Groups'], controls: [
      { id: 'groups', type: 'list', label: 'Name', rows: [
        { id: 'administrators', cells: ['Administrators'], actions: [{ id: 'properties', label: 'Properties', action: { open: 'grp-admins' } }] },
        { id: 'guests', cells: ['Guests'], actions: [] },
        { id: 'rdu', cells: ['Remote Desktop Users'], actions: [{ id: 'properties', label: 'Properties', action: { open: 'grp-rdu' } }] },
        { id: 'users', cells: ['Users'], actions: [{ id: 'properties', label: 'Properties', action: { open: 'grp-users' } }] },
      ] },
      { id: 'nav-users', type: 'link', label: 'Users', screen: 'lusr-users' },
    ] },
    { id: 'grp-admins', app: 'lusrmgr', title: 'Administrators Properties', crumbs: ['Groups', 'Administrators'], controls: [
      { id: 'admin-members', type: 'list', label: 'Members', rows: [
        { id: 'administrator', cells: ['DRAFT-11\\Administrator'], actions: [] },
        { id: 'cedaradmin', visibleIf: { key: 'adm.cedaradmin', op: 'truthy' }, cells: ['DRAFT-11\\cedaradmin'], actions: [{ id: 'remove', label: 'Remove', action: { set: { 'adm.cedaradmin': false }, msg: 'cedaradmin was removed from Administrators.' } }] },
        { id: 'pmorales', visibleIf: { key: 'adm.pmorales', op: 'truthy' }, cells: ['DRAFT-11\\pmorales'], actions: [{ id: 'remove', label: 'Remove', action: { set: { 'adm.pmorales': false }, msg: 'pmorales was removed from Administrators.' } }] },
      ] },
      { id: 'admins-add', type: 'link', label: 'Add...', screen: 'select-admins' },
      { id: 'admins-ok', type: 'link', label: 'OK', screen: 'lusr-groups' },
    ] },
    { id: 'select-admins', app: 'lusrmgr', title: 'Select Users', crumbs: ['Administrators', 'Add'], controls: [
      { id: 'admin-names', type: 'text', label: 'Enter the object names to select:', key: 'sel.admin' },
      { id: 'admin-select-ok', type: 'button', label: 'OK', visibleIf: { key: 'sel.admin', op: 'matches', value: CEDARADMIN },
        action: { set: { 'adm.cedaradmin': true, 'sel.admin': '' }, open: 'grp-admins', msg: 'DRAFT-11\\cedaradmin was added to Administrators.' } },
      { id: 'admin-select-ok-pm', type: 'button', label: 'OK', visibleIf: { key: 'sel.admin', op: 'matches', value: PMORALES },
        action: { set: { 'adm.pmorales': true, 'sel.admin': '' }, open: 'grp-admins', msg: 'DRAFT-11\\pmorales was added to Administrators.' } },
      { id: 'admin-select-ok-none', type: 'button', label: 'OK', visibleIf: { not: { any: [{ key: 'sel.admin', op: 'matches', value: CEDARADMIN }, { key: 'sel.admin', op: 'matches', value: PMORALES }] } },
        action: { msg: 'No local account on DRAFT-11 has that name. Check the spelling against the Users folder.' } },
      { id: 'admin-select-cancel', type: 'link', label: 'Cancel', screen: 'grp-admins' },
    ] },
    { id: 'grp-rdu', app: 'lusrmgr', title: 'Remote Desktop Users Properties', crumbs: ['Groups', 'Remote Desktop Users'], controls: [
      { id: 'rdu-members', type: 'list', label: 'Members', rows: [
        { id: 'pmorales', visibleIf: { key: 'rdu.pmorales', op: 'truthy' }, cells: ['DRAFT-11\\pmorales'], actions: [{ id: 'remove', label: 'Remove', action: { set: { 'rdu.pmorales': false }, msg: 'pmorales was removed from Remote Desktop Users.' } }] },
        { id: 'cedaradmin', visibleIf: { key: 'rdu.cedaradmin', op: 'truthy' }, cells: ['DRAFT-11\\cedaradmin'], actions: [{ id: 'remove', label: 'Remove', action: { set: { 'rdu.cedaradmin': false }, msg: 'cedaradmin was removed from Remote Desktop Users.' } }] },
      ] },
      { id: 'rdu-add', type: 'link', label: 'Add...', screen: 'select-users' },
      { id: 'rdu-ok', type: 'link', label: 'OK', screen: 'lusr-groups' },
    ] },
    { id: 'grp-users', app: 'lusrmgr', title: 'Users Properties', crumbs: ['Groups', 'Users'], controls: [
      { id: 'users-members', type: 'info', values: [['Members:', 'NT AUTHORITY\\Authenticated Users, NT AUTHORITY\\INTERACTIVE']] },
      { id: 'users-ok', type: 'link', label: 'OK', screen: 'lusr-groups' },
    ] },
    { id: 'select-users', app: 'lusrmgr', title: 'Select Users', crumbs: ['Remote Desktop Users', 'Add'], controls: [
      { id: 'names', type: 'text', label: 'Enter the object names to select:', key: 'sel.name' },
      { id: 'select-ok', type: 'button', label: 'OK', visibleIf: { key: 'sel.name', op: 'matches', value: PMORALES },
        action: { set: { 'rdu.pmorales': true, 'sel.name': '' }, open: 'grp-rdu', msg: 'DRAFT-11\\pmorales was added to Remote Desktop Users.' } },
      { id: 'select-ok-cedaradmin', type: 'button', label: 'OK', visibleIf: { key: 'sel.name', op: 'matches', value: CEDARADMIN },
        action: { set: { 'rdu.cedaradmin': true, 'sel.name': '' }, open: 'grp-rdu', msg: 'DRAFT-11\\cedaradmin was added to Remote Desktop Users.' } },
      { id: 'select-ok-none', type: 'button', label: 'OK', visibleIf: { not: { any: [{ key: 'sel.name', op: 'matches', value: PMORALES }, { key: 'sel.name', op: 'matches', value: CEDARADMIN }] } },
        action: { msg: 'No local account on DRAFT-11 has that name. Check the spelling against the Users folder.' } },
      { id: 'select-cancel', type: 'link', label: 'Cancel', screen: 'grp-rdu' },
    ] },
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-rd', type: 'link', label: 'System > Remote Desktop', screen: 'remote-desktop' },
    ] },
    { id: 'remote-desktop', app: 'settings', title: 'Remote Desktop', crumbs: ['Settings', 'System', 'Remote Desktop'], controls: [
      { id: 'rd-toggle', type: 'toggle', label: 'Remote Desktop', key: 'rd.on' },
      { id: 'pc-name', type: 'info', values: [['PC name', 'DRAFT-11']] },
    ] },
  ],
  goals: [
    { id: 'rd-on', text: 'Turn on Remote Desktop on DRAFT-11', check: { key: 'rd.on', op: 'truthy' },
      why: 'A PC accepts Remote Desktop connections only when Remote Desktop is turned on, and only on Windows 11 Pro or higher editions.',
      expect: 'Settings > System > Remote Desktop is On.',
      hints: ['Before any account can connect, the PC itself has to accept remote connections.', 'Turn on Remote Desktop in Settings > System.', 'Start > Settings > System > Remote Desktop > turn on Remote Desktop > Confirm.'],
      src: ['remoteDesktop', 'launchSettings'] },
    { id: 'rdu-member', text: 'Add pmorales to Remote Desktop Users', check: { key: 'rdu.pmorales', op: 'truthy' },
      why: 'Remote Desktop sign-in is granted to members of Administrators and Remote Desktop Users. Microsoft recommends controlling who can connect by adding users to, or removing them from, Remote Desktop Users: it grants the remote sign-in and nothing more.',
      expect: 'Remote Desktop Users lists DRAFT-11\\pmorales.',
      hints: ['There is a built-in local group made exactly for people who only need remote sign-in.', 'In Local Users and Groups > Groups (lusrmgr.msc, or Computer Management > System Tools > Local Users and Groups), open Remote Desktop Users and add pmorales.', 'lusrmgr.msc > Groups > Remote Desktop Users > Properties > Add... > type pmorales > OK.'],
      src: ['rdsLogon', 'addGroupMember'] },
    { id: 'not-admin', text: 'Remove pmorales from Administrators', check: { key: 'adm.pmorales', op: 'falsy' },
      why: 'Members of Administrators have full control of the device. A contractor who only needs to sign in remotely gets least privilege: keep the Administrators group small and take her out.',
      expect: 'Administrators lists Administrator and cedaradmin only.',
      hints: ['Check which groups pmorales is in right now. One of them gives far more than she needs.', 'Open the Administrators group and remove pmorales.', 'lusrmgr.msc > Groups > Administrators > Properties > select DRAFT-11\\pmorales > Remove > OK.'],
      src: ['localAccounts', 'addGroupMember'] },
  ],
  traps: [
    { id: 'still-admin', critical: true, check: { key: 'adm.pmorales', op: 'truthy' },
      message: 'pmorales is still in Administrators. Admin membership already allows Remote Desktop sign-in, but it also gives the contractor full control of DRAFT-11: installing software, changing security settings, reading every user\'s files. Remove her from Administrators and use Remote Desktop Users instead.',
      why: 'Grant the narrowest group that does the job. Remote access is not a reason for admin rights.',
      src: ['localAccounts', 'rdsLogon'] },
    { id: 'it-admin-removed', check: { key: 'adm.cedaradmin', op: 'falsy' },
      message: 'You removed cedaradmin from Administrators. Windows setup disables the built-in Administrator account, so cedaradmin was the working admin account on this PC; without it, IT may have no way to make admin changes. Add it back to Administrators.',
      why: 'Read the member list before you remove anyone, and remove only the account the ticket names.',
      src: ['localAccounts', 'addGroupMember'] },
  ],
  solution: [
    launch('ms-settings:remotedesktop', 'Open Settings > System > Remote Desktop.'),
    set('rd-toggle', true, 'Turn on Remote Desktop (and Confirm). DRAFT-11 runs Windows 11 Pro, so it can accept connections.'),
    launch('lusrmgr.msc', 'Open Local Users and Groups (Windows+R, lusrmgr.msc).'),
    act('nav-groups', null, null, 'Open the Groups folder.'),
    act('groups', 'administrators', 'properties', 'Open Administrators. Members: Administrator, cedaradmin and pmorales, who should not be here.'),
    act('admin-members', 'pmorales', 'remove', 'Select DRAFT-11\\pmorales and Remove. Leave cedaradmin, the IT admin account.'),
    act('admins-ok', null, null, 'Select OK to go back to Groups.'),
    act('groups', 'rdu', 'properties', 'Open Remote Desktop Users.'),
    act('rdu-add', null, null, 'Select Add...'),
    set('names', 'pmorales', 'Type pmorales.'),
    act('select-ok', null, null, 'Select OK. pmorales can now sign in with Remote Desktop, as a standard user.'),
  ],
  trapDemo: [
    launch('lusrmgr.msc'),
    act('nav-groups'),
    act('groups', 'administrators', 'properties'),
    act('admin-members', 'cedaradmin', 'remove'),
    act('admins-add'),
    set('admin-names', 'cedaradmin'),
    act('admin-select-ok'),
  ],
  src: ['localAccounts', 'rdsLogon', 'addGroupMember', 'remoteDesktop'],
};

// win-07: Static IPv4 on Ethernet in Settings.
const WANT = { ip: '192.168.40.25', mask: '255.255.255.0', gw: '192.168.40.1', dns1: '192.168.40.10', dns2: '192.168.40.11' };
// The form writes draft keys (eth.mode ... eth.dns2). Save copies their current values into
// eth.ap.* and records grading flags under eth.grade.*. The Ethernet page reads only applied values.
const ethManual = [is('eth.mode', 'Manual'), { key: 'eth.v4', op: 'truthy' }];
const field = (key, value) => ({ key, op: 'matches', value: exact(value) });
const filled = (key) => ({ key, op: 'matches', value: '\\S' });
const draft = {
  manual: { all: ethManual },
  addr: { all: [field('eth.ip', WANT.ip), field('eth.mask', WANT.mask)] },
  gw: {
    ok: field('eth.gw', WANT.gw),
    off: { all: [filled('eth.gw'), { not: { key: 'eth.gw', op: 'matches', value: '^\\s*192\\.168\\.40\\.' } }] },
  },
  dns: {
    ok: { all: [field('eth.dns1', WANT.dns1), field('eth.dns2', WANT.dns2)] },
    empty: { not: filled('eth.dns1') },
  },
};
draft.gw.other = { not: { any: [draft.gw.ok, draft.gw.off] } };
draft.dns.other = { not: { any: [draft.dns.ok, draft.dns.empty] } };
// Save validation, as in Windows: Manual IPv4 needs a well-formed IP address and a contiguous,
// nonzero subnet mask; gateway and DNS may be blank but must be well-formed IPv4 when filled.
// Well-formed but wrong ticket values stay savable so the goals and traps can grade them.
const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4 = `^\\s*${OCTET}(?:\\.${OCTET}){3}\\s*$`;
const MASKS = Array.from({ length: 32 }, (_, i) => {
  const bits = 0xffffffff << (31 - i) >>> 0;
  return [24, 16, 8, 0].map((shift) => (bits >>> shift) & 255).join('\\.');
});
const MASK = `^\\s*(?:${MASKS.join('|')})\\s*$`;
const wellFormed = (key, pattern) => ({ key, op: 'matches', value: pattern });
const blankOrIp = (key) => ({ any: [{ not: filled(key) }, wellFormed(key, IPV4)] });
const ETH_CHECKS = [
  [{ not: filled('eth.ip') }, 'ip', 'Enter an IP address. Manual IPv4 settings need an IP address and a subnet mask.'],
  [{ not: wellFormed('eth.ip', IPV4) }, 'ip-format', 'The IP address {{eth.ip}} is not a valid IPv4 address. Enter four numbers from 0 to 255 separated by dots, for example 10.1.2.3.'],
  [{ not: filled('eth.mask') }, 'mask', 'Enter a subnet mask. Manual IPv4 settings need an IP address and a subnet mask.'],
  [{ not: wellFormed('eth.mask', MASK) }, 'mask-format', 'The subnet mask {{eth.mask}} is not valid. A subnet mask is a run of 1 bits followed by 0 bits, written as four numbers, for example 255.255.0.0.'],
  [{ not: blankOrIp('eth.gw') }, 'gw-format', 'The gateway {{eth.gw}} is not a valid IPv4 address. Correct the gateway before you save.'],
  [{ not: blankOrIp('eth.dns1') }, 'dns1-format', 'The preferred DNS server {{eth.dns1}} is not a valid IPv4 address. Correct it before you save.'],
  [{ not: blankOrIp('eth.dns2') }, 'dns2-format', 'The alternate DNS server {{eth.dns2}} is not a valid IPv4 address. Correct it before you save.'],
];
draft.valid = { all: ETH_CHECKS.map(([fails]) => ({ not: fails })) };
const applied = (flag) => ({ key: `eth.grade.${flag}`, op: 'truthy' });
const ethSaved = { all: [{ key: 'eth.saved', op: 'truthy' }, applied('manual')] };
const ETH_START = { 'eth.mode': 'Automatic (DHCP)', 'eth.v4': false, 'eth.ip': '', 'eth.mask': '', 'eth.gw': '', 'eth.dns1': '', 'eth.dns2': '' };
const ETH_AP_START = Object.fromEntries(Object.entries(ETH_START).map(([key, value]) => [key.replace('eth.', 'eth.ap.'), value]));
const ETH_APPLY = Object.fromEntries(Object.keys(ETH_START).map((key) => [key.replace('eth.', 'eth.ap.'), key]));
const ETH_RESTORE = Object.fromEntries(Object.entries(ETH_APPLY).map(([target, source]) => [source, target]));
const AP_NONE = { 'eth.grade.manual': false, 'eth.grade.addr': false, 'eth.grade.gw': false, 'eth.grade.gwoff': false, 'eth.grade.dns': false, 'eth.grade.dnsempty': false };
const ethSaveButtons = [
  // Exactly one Save is visible: the first failing field refuses with its own message; no state changes.
  ...ETH_CHECKS.map(([fails, id, msg], i) => ({
    id: `eth-save-invalid-${id}`, type: 'button', label: 'Save',
    visibleIf: { all: [draft.manual, ...ETH_CHECKS.slice(0, i).map(([earlier]) => ({ not: earlier })), fails] },
    action: { refuse: `Can't save these IP settings. ${msg}` },
  })),
  { id: 'eth-save-dhcp', type: 'button', label: 'Save', visibleIf: { not: draft.manual },
    action: { copy: ETH_APPLY, set: { 'eth.saved': true, ...AP_NONE }, open: 'eth', msg: 'Ethernet IP settings saved.' } },
  ...[true, false].flatMap((addr) => ['ok', 'off', 'other'].flatMap((gw) => ['ok', 'empty', 'other'].map((dns) => ({
    id: addr && gw === 'ok' && dns === 'ok' ? 'eth-save' : `eth-save-${addr ? 'addr' : 'noaddr'}-gw${gw}-dns${dns}`,
    type: 'button', label: 'Save',
    visibleIf: { all: [draft.manual, draft.valid, addr ? draft.addr : { not: draft.addr }, draft.gw[gw], draft.dns[dns]] },
    action: { copy: ETH_APPLY, set: { 'eth.saved': true, 'eth.grade.manual': true, 'eth.grade.addr': addr, 'eth.grade.gw': gw === 'ok', 'eth.grade.gwoff': gw === 'off', 'eth.grade.dns': dns === 'ok', 'eth.grade.dnsempty': dns === 'empty' },
      open: 'eth', msg: 'Ethernet IP settings saved.' },
  })))),
];
// Retain the action IDs used by the reference replay while every Cancel restores the applied form values.
const appliedAll = { all: [{ key: 'eth.saved', op: 'truthy' }, ...['manual', 'addr', 'gw', 'dns'].map(applied)] };
const ethCancelButtons = [
  { id: 'eth-cancel', type: 'button', label: 'Cancel', visibleIf: { key: 'eth.saved', op: 'falsy' }, action: { copy: ETH_RESTORE, open: 'eth', msg: 'No changes were saved.' } },
  { id: 'eth-cancel-dhcp', type: 'button', label: 'Cancel', visibleIf: { all: [{ key: 'eth.saved', op: 'truthy' }, { not: applied('manual') }] }, action: { copy: ETH_RESTORE, open: 'eth', msg: 'No changes were saved.' } },
  { id: 'eth-cancel-want', type: 'button', label: 'Cancel', visibleIf: appliedAll, action: { copy: ETH_RESTORE, open: 'eth', msg: 'No changes were saved.' } },
  { id: 'eth-cancel-other', type: 'button', label: 'Cancel', visibleIf: { all: [ethSaved, { not: appliedAll }] }, action: { copy: ETH_RESTORE, open: 'eth', msg: 'No changes were saved. The Ethernet page still uses the settings from your last Save.' } },
];
const win07 = {
  id: 'win-07', title: 'Static IPv4 for the print room PC', level: 3, minutes: 9,
  scenario: 'The network admin at Seaside Library sent this for PRINTROOM-01: "Ethernet: 192.168.40.25/24, gateway 192.168.40.1, DNS 192.168.40.10 and 192.168.40.11. Leave the Wi-Fi adapter (SeasideStaff) on automatic." Configure the Ethernet adapter in Settings.',
  examObjs: { 'aplus-1202': ['1.6', '1.7'] }, objs: [],
  skin: 'windows',
  state: {
    ...ETH_START, ...ETH_AP_START, 'eth.saved': false, ...AP_NONE,
    'wifi.mode': 'Automatic (DHCP)', 'wifi.saved': false,
  },
  apps: [
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:network-status', screen: 'net-home' }, { q: 'ms-settings:network-ethernet', screen: 'eth' }, { q: 'ms-settings:network-wifi', screen: 'wifi' }, { q: 'ms-settings:network-wifisettings', screen: 'wifi-known' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-network', type: 'link', label: 'Network & internet', screen: 'net-home' },
    ] },
    { id: 'net-home', app: 'settings', title: 'Network & internet', crumbs: ['Settings', 'Network & internet'], controls: [
      { id: 'nav-eth', type: 'link', label: 'Ethernet', screen: 'eth' },
      { id: 'nav-wifi', type: 'link', label: 'Wi-Fi', screen: 'wifi' },
    ] },
    { id: 'eth', app: 'settings', title: 'Ethernet', crumbs: ['Settings', 'Network & internet', 'Ethernet'], controls: [
      { id: 'eth-dhcp-info', type: 'info', visibleIf: { not: is('eth.ap.mode', 'Manual') }, values: [['IP assignment:', 'Automatic (DHCP)'], ['IPv4 address:', '192.168.40.117'], ['IPv4 DNS servers:', '192.168.40.1']] },
      { id: 'eth-manual-info', type: 'info', visibleIf: is('eth.ap.mode', 'Manual'), values: [['IP assignment:', 'Manual'], ['IPv4 address:', '{{eth.ap.ip}}'], ['IPv4 mask:', '{{eth.ap.mask}}'], ['IPv4 gateway:', '{{eth.ap.gw}}'], ['IPv4 DNS servers:', '{{eth.ap.dns1}} {{eth.ap.dns2}}']] },
      { id: 'eth-edit', type: 'button', label: 'IP assignment: Edit', action: { copy: ETH_RESTORE, open: 'eth-edit' } },
    ] },
    { id: 'eth-edit', app: 'settings', title: 'Edit IP settings', crumbs: ['Ethernet', 'Edit IP settings'], controls: [
      { id: 'eth-mode', type: 'select', label: 'Edit IP settings', key: 'eth.mode', options: ['Automatic (DHCP)', 'Manual'] },
      { id: 'eth-v4', type: 'toggle', label: 'IPv4', key: 'eth.v4', visibleIf: is('eth.mode', 'Manual') },
      { id: 'eth-ip', type: 'text', label: 'IP address', key: 'eth.ip', visibleIf: { all: ethManual } },
      { id: 'eth-mask', type: 'text', label: 'Subnet mask', key: 'eth.mask', visibleIf: { all: ethManual } },
      { id: 'eth-gw', type: 'text', label: 'Gateway', key: 'eth.gw', visibleIf: { all: ethManual } },
      { id: 'eth-dns1', type: 'text', label: 'Preferred DNS', key: 'eth.dns1', visibleIf: { all: ethManual } },
      { id: 'eth-dns2', type: 'text', label: 'Alternate DNS', key: 'eth.dns2', visibleIf: { all: ethManual } },
      ...ethSaveButtons,
      ...ethCancelButtons,
    ] },
    { id: 'wifi', app: 'settings', title: 'Wi-Fi', crumbs: ['Settings', 'Network & internet', 'Wi-Fi'], controls: [
      { id: 'wifi-status', type: 'info', values: [['Connected:', 'SeasideStaff']] },
      { id: 'nav-known', type: 'link', label: 'Manage known networks', screen: 'wifi-known' },
    ] },
    { id: 'wifi-known', app: 'settings', title: 'Manage known networks', crumbs: ['Wi-Fi', 'Manage known networks'], controls: [
      { id: 'known', type: 'list', label: 'Known networks', rows: [
        { id: 'staff', cells: ['SeasideStaff'], actions: [{ id: 'properties', label: 'Properties', action: { open: 'wifi-props' } }] },
      ] },
    ] },
    { id: 'wifi-props', app: 'settings', title: 'SeasideStaff', crumbs: ['Manage known networks', 'SeasideStaff'], controls: [
      { id: 'wifi-ip-info', type: 'info', values: [['IP assignment:', '{{wifi.mode}}']] },
      { id: 'wifi-edit', type: 'link', label: 'IP assignment: Edit', screen: 'wifi-edit-ip' },
    ] },
    { id: 'wifi-edit-ip', app: 'settings', title: 'Edit IP settings', crumbs: ['SeasideStaff', 'Edit IP settings'], controls: [
      { id: 'wifi-mode', type: 'select', label: 'Edit IP settings', key: 'wifi.mode', options: ['Automatic (DHCP)', 'Manual'] },
      { id: 'wifi-save', type: 'button', label: 'Save', action: { set: { 'wifi.saved': true }, open: 'wifi-props', msg: 'Wi-Fi IP settings saved.' } },
      { id: 'wifi-cancel', type: 'link', label: 'Cancel', screen: 'wifi-props' },
    ] },
  ],
  goals: [
    { id: 'manual-ipv4', text: 'Switch the Ethernet adapter to Manual with IPv4 on', check: ethSaved,
      why: 'A printer-room PC that other devices reach by address needs an address that never changes. Manual IP assignment with IPv4 turned on stops the adapter from taking whatever DHCP hands out.',
      expect: 'Ethernet > IP assignment shows Manual after Save.',
      hints: ['The IP settings for each adapter are on its own page in Network & internet.', 'In Settings > Network & internet > Ethernet, edit IP assignment, choose Manual and turn on IPv4.', 'Settings > Network & internet > Ethernet > IP assignment > Edit > Manual > IPv4 On.'],
      src: ['netSettings', 'launchSettings'] },
    { id: 'address', text: 'Enter the address and subnet mask from the ticket', check: { all: [ethSaved, applied('addr')] },
      why: 'The ticket gives 192.168.40.25/24. The /24 prefix means the first 24 bits are the network, which is the subnet mask 255.255.255.0. Settings asks for the mask, so convert the prefix.',
      expect: 'IP address 192.168.40.25, Subnet mask 255.255.255.0, saved.',
      hints: ['The ticket writes the mask as a prefix length after the slash.', 'IP address 192.168.40.25; a /24 prefix is 255.255.255.0.', 'In Edit IP settings type IP address 192.168.40.25 and Subnet mask 255.255.255.0, then Save.'],
      src: ['netSettings'] },
    { id: 'gateway', text: 'Enter the default gateway', check: { all: [ethSaved, applied('gw')] },
      why: 'The gateway is the router the PC sends traffic to when the destination is outside 192.168.40.0/24. It must be an address inside the PC\'s own subnet, or nothing beyond the local network is reachable.',
      expect: 'Gateway 192.168.40.1, saved.',
      hints: ['Without a gateway the PC reaches only its own subnet.', 'Gateway 192.168.40.1, the address in the ticket.', 'In Edit IP settings type Gateway 192.168.40.1, then Save.'],
      src: ['netSettings'] },
    { id: 'dns', text: 'Enter both DNS servers', check: { all: [ethSaved, applied('dns')] },
      why: 'With a manual address the adapter no longer learns DNS servers from DHCP. Without them, names such as the print server and websites do not resolve even though ping by address works. The alternate server keeps names working if the first one is down.',
      expect: 'Preferred DNS 192.168.40.10 and Alternate DNS 192.168.40.11, saved.',
      hints: ['Manual settings mean you also supply what DHCP used to provide for name resolution.', 'Preferred DNS 192.168.40.10, Alternate DNS 192.168.40.11.', 'In Edit IP settings type Preferred DNS 192.168.40.10 and Alternate DNS 192.168.40.11, then Save.'],
      src: ['netSettings'] },
  ],
  traps: [
    { id: 'gw-off-subnet', check: { all: [ethSaved, applied('gwoff')] },
      message: 'The gateway you saved is not in 192.168.40.0/24, the subnet of 192.168.40.25/24. The PC cannot reach a router outside its own subnet, so everything beyond the local network (other buildings, the internet) is unreachable. Use 192.168.40.1.',
      why: 'The default gateway must be on the same subnet as the address: same network bits under the mask.',
      src: ['netSettings'] },
    { id: 'dns-empty', check: { all: [ethSaved, applied('dnsempty')] },
      message: 'You saved a manual IPv4 address with no Preferred DNS. The PC can reach addresses but cannot turn names into addresses, so the print server name and websites fail. Enter 192.168.40.10 and 192.168.40.11.',
      why: 'Manual IP settings replace everything DHCP supplied, DNS included. Fill in DNS whenever you set a static address.',
      src: ['netSettings'] },
    { id: 'wifi-changed', check: { all: [is('wifi.mode', 'Manual'), { key: 'wifi.saved', op: 'truthy' }] },
      message: 'You changed the Wi-Fi network SeasideStaff to Manual. The ticket said to leave Wi-Fi on automatic: a static setting copied to the wrong adapter breaks that connection or creates an address conflict. Set it back to Automatic (DHCP).',
      why: 'IP settings are per adapter and per network. Change only the adapter in the ticket.',
      src: ['netSettings'] },
  ],
  solution: [
    launch('ms-settings:network-ethernet', 'Open Settings > Network & internet > Ethernet. It shows IP assignment Automatic (DHCP).'),
    act('eth-edit', null, null, 'Next to IP assignment select Edit.'),
    set('eth-mode', 'Manual', 'Choose Manual.'),
    set('eth-v4', true, 'Turn on IPv4.'),
    set('eth-ip', WANT.ip, 'IP address 192.168.40.25.'),
    set('eth-mask', WANT.mask, 'Subnet mask 255.255.255.0: the /24 in the ticket.'),
    set('eth-gw', WANT.gw, 'Gateway 192.168.40.1, inside the same subnet.'),
    set('eth-dns1', WANT.dns1, 'Preferred DNS 192.168.40.10.'),
    set('eth-dns2', WANT.dns2, 'Alternate DNS 192.168.40.11.'),
    act('eth-save', null, null, 'Save. Ethernet now shows Manual with the new address, gateway and DNS servers. Wi-Fi stays on Automatic (DHCP).'),
  ],
  trapDemo: [
    launch('ms-settings:network-ethernet'),
    act('eth-edit'),
    set('eth-mode', 'Manual'),
    set('eth-v4', true),
    set('eth-ip', WANT.ip),
    set('eth-mask', WANT.mask),
    act('eth-save-addr-gwother-dnsempty'),
    act('eth-edit'),
    set('eth-ip', WANT.ip),
    set('eth-mask', WANT.mask),
    set('eth-gw', WANT.gw),
    set('eth-dns1', WANT.dns1),
    set('eth-dns2', WANT.dns2),
    act('eth-cancel-other'),
    act('eth-edit'),
    set('eth-ip', WANT.ip),
    set('eth-mask', WANT.mask),
    set('eth-gw', '192.168.4.1'),
    set('eth-dns1', WANT.dns1),
    set('eth-dns2', WANT.dns2),
    act('eth-save-addr-gwoff-dnsok'),
    launch('ms-settings:network-wifisettings'),
    act('known', 'staff', 'properties'),
    act('wifi-edit'),
    set('wifi-mode', 'Manual'),
    act('wifi-save'),
  ],
  src: ['netSettings', 'launchSettings'],
};

// win-08: Windows Security on a laptop used on public Wi-Fi.
const fwRows = [['domain', 'Domain network'], ['private', 'Private network'], ['public', 'Public network']].flatMap(([id, name]) => [
  { id, visibleIf: { key: `fw.${id}`, op: 'truthy' }, cells: [name, 'Microsoft Defender Firewall: On'], actions: [{ id: 'open', label: 'Open', action: { open: `fw-${id}` } }] },
  { id, visibleIf: { key: `fw.${id}`, op: 'falsy' }, cells: [name, 'Microsoft Defender Firewall: Off'], actions: [{ id: 'open', label: 'Open', action: { open: `fw-${id}` } }] },
]);
const fwScreen = (id, name) => ({ id: `fw-${id}`, app: 'security', title: name, crumbs: ['Firewall & network protection', name], controls: [
  { id: `fw-${id}-toggle`, type: 'toggle', label: 'Microsoft Defender Firewall', key: `fw.${id}` },
  { id: `fw-${id}-block`, type: 'toggle', label: 'Blocks all incoming connections, including those in the list of allowed apps', key: `fw.${id}.blockall` },
  { id: `fw-${id}-back`, type: 'link', label: 'Firewall & network protection', screen: 'fw' },
] });
const win08 = {
  id: 'win-08', title: 'Harden a laptop for cafe Wi-Fi', level: 3, minutes: 9,
  scenario: 'Sam Okafor at Brightwater Travel works from cafes on laptop LT-07. Real-time protection was turned off while a tool was installed; Tamper protection is currently on. An old helpdesk note says the Public network firewall was switched off "to fix a printer", and cafe Wi-Fi CafeLumen is set to Private network. There are no signs of infection; restore protection and run the scan that fits.',
  examObjs: { 'aplus-1202': ['1.7', '2.2', '2.4'] }, objs: [],
  skin: 'windows',
  state: {
    'rtp.on': false, 'tamper.on': true, 'scan.result': 'No current threats. Last scan: 9/28/2026 (quick scan).',
    'fw.domain': true, 'fw.private': true, 'fw.public': false,
    'fw.domain.blockall': false, 'fw.private.blockall': false, 'fw.public.blockall': false,
    'net.profile': 'Private network',
  },
  apps: [
    { id: 'security', name: 'Windows Security', launch: ['windows security'], icon: 'security', home: 'sec-home' },
    { id: 'settings', name: 'Settings', launch: ['settings', 'ms-settings:', { q: 'ms-settings:network-wifi', screen: 'wifi' }], icon: 'settings', home: 'settings-home' },
  ],
  screens: [
    { id: 'sec-home', app: 'security', title: 'Windows Security', crumbs: ['Home'], controls: [
      { id: 'nav-virus', type: 'link', label: 'Virus & threat protection', screen: 'virus' },
      { id: 'nav-fw', type: 'link', label: 'Firewall & network protection', screen: 'fw' },
    ] },
    { id: 'virus', app: 'security', title: 'Virus & threat protection', crumbs: ['Home', 'Virus & threat protection'], controls: [
      { id: 'current', type: 'info', label: 'Current threats', text: '{{scan.result}}' },
      { id: 'quick-scan', type: 'button', label: 'Quick scan', action: { set: { 'scan.result': 'No current threats. Last scan: today (quick scan).' }, msg: 'Quick scan finished. No current threats.' } },
      { id: 'nav-scan-options', type: 'link', label: 'Scan options', screen: 'scan-options' },
      { id: 'nav-manage', type: 'link', label: 'Virus & threat protection settings: Manage settings', screen: 'virus-settings' },
      { id: 'virus-back', type: 'link', label: 'Home', screen: 'sec-home' },
    ] },
    { id: 'scan-options', app: 'security', title: 'Scan options', crumbs: ['Virus & threat protection', 'Scan options'], controls: [
      { id: 'options', type: 'info', values: [['Quick scan', 'Checks the folders where threats are commonly found.'], ['Full scan', 'Checks all files and running programs; can take a long time.'], ['Custom scan', 'Choose which files and locations to check.'], ['Microsoft Defender Antivirus (offline scan)', 'Restarts the device and scans before Windows loads. Use it when you suspect malware.']] },
      { id: 'options-back', type: 'link', label: 'Virus & threat protection', screen: 'virus' },
    ] },
    { id: 'virus-settings', app: 'security', title: 'Virus & threat protection settings', crumbs: ['Virus & threat protection', 'Manage settings'], controls: [
      { id: 'rtp', type: 'toggle', label: 'Real-time protection', key: 'rtp.on' },
      { id: 'tamper', type: 'toggle', label: 'Tamper protection', key: 'tamper.on' },
      { id: 'settings-back', type: 'link', label: 'Virus & threat protection', screen: 'virus' },
    ] },
    { id: 'fw', app: 'security', title: 'Firewall & network protection', crumbs: ['Home', 'Firewall & network protection'], controls: [
      { id: 'profiles', type: 'list', label: 'Network profiles', rows: fwRows },
      { id: 'fw-back', type: 'link', label: 'Home', screen: 'sec-home' },
    ] },
    fwScreen('domain', 'Domain network'),
    fwScreen('private', 'Private network'),
    fwScreen('public', 'Public network'),
    { id: 'settings-home', app: 'settings', title: 'Settings', crumbs: ['Settings'], controls: [
      { id: 'nav-wifi', type: 'link', label: 'Network & internet > Wi-Fi', screen: 'wifi' },
    ] },
    { id: 'wifi', app: 'settings', title: 'Wi-Fi', crumbs: ['Settings', 'Network & internet', 'Wi-Fi'], controls: [
      { id: 'wifi-status', type: 'info', values: [['Connected:', 'CafeLumen']] },
      { id: 'nav-cafe', type: 'link', label: 'CafeLumen properties', screen: 'cafe' },
    ] },
    { id: 'cafe', app: 'settings', title: 'CafeLumen', crumbs: ['Wi-Fi', 'CafeLumen'], controls: [
      { id: 'profile', type: 'select', label: 'Network profile type', key: 'net.profile', options: ['Public network (Recommended)', 'Private network'] },
    ] },
  ],
  goals: [
    { id: 'rtp-on', text: 'Turn Real-time protection back on', check: { key: 'rtp.on', op: 'truthy' },
      why: 'While Real-time protection is off, files you open or download are not scanned. It turns itself back on after a short while, but on a laptop on public Wi-Fi you turn it on now rather than wait.',
      expect: 'Virus & threat protection settings: Real-time protection On.',
      hints: ['Antivirus scanning as files are opened is a setting inside the Windows Security app.', 'Windows Security > Virus & threat protection > Manage settings > Real-time protection.', 'Open Windows Security > Virus & threat protection > Manage settings and turn Real-time protection On.'],
      src: ['rtpOff', 'virusProtection'] },
    { id: 'public-fw', text: 'Turn on the firewall for the Public network profile', check: { key: 'fw.public', op: 'truthy' },
      why: 'Each network profile has its own Microsoft Defender Firewall switch. Untrusted networks such as cafes use the Public profile, the one with the strictest rules; with it off, any device on the cafe network can try to reach the laptop.',
      expect: 'Firewall & network protection: Public network, Microsoft Defender Firewall On.',
      hints: ['The firewall is set per network profile. Check all three.', 'Windows Security > Firewall & network protection > Public network.', 'Windows Security > Firewall & network protection > Public network > Microsoft Defender Firewall On.'],
      src: ['firewall'] },
    { id: 'profile-public', text: 'Set the cafe Wi-Fi to the Public network profile', check: is('net.profile', 'Public network (Recommended)'),
      why: 'Private network makes the laptop discoverable and allows file and printer sharing, which is meant for trusted home or office networks. A cafe network is untrusted: Public network hides the PC from other devices and applies the Public firewall rules.',
      expect: 'CafeLumen: Network profile type Public network (Recommended).',
      hints: ['Which profile Windows applies depends on how the network itself is set, not just on the firewall switches.', 'In Settings > Network & internet > Wi-Fi, open CafeLumen and change its network profile type.', 'Settings > Network & internet > Wi-Fi > CafeLumen properties > Network profile type: Public network (Recommended).'],
      src: ['netSettings', 'firewall'] },
    { id: 'quick-scan', text: 'Run a quick scan', check: { used: 'action:quick-scan' },
      why: 'Protection was off while a tool was installed, so check the places threats usually land. With no signs of infection a quick scan fits; the offline scan restarts the laptop and is for when you suspect malware that hides from Windows.',
      expect: 'A quick scan ran: Current threats reads No current threats, last scan today.',
      hints: ['After protection was off, check the PC; pick the scan that matches "no signs of infection".', 'Run a Quick scan from Virus & threat protection.', 'Windows Security > Virus & threat protection > Quick scan.'],
      src: ['virusProtection', 'defenderOffline'] },
  ],
  traps: [
    { id: 'public-fw-off', critical: true, check: { key: 'fw.public', op: 'falsy' },
      message: 'The Public network firewall is off. CafeLumen should use the Public network profile, and its firewall must be on. If CafeLumen is already set to Public, the laptop currently lacks that firewall filtering. Turn the Public firewall on.',
      why: 'Turning the firewall off makes a device more vulnerable to unauthorized access. A laptop that leaves the office never has its Public firewall off.',
      src: ['firewall'] },
    { id: 'tamper-off', check: { key: 'tamper.on', op: 'falsy' },
      message: 'You turned off Tamper protection. It stops malicious apps from changing Microsoft Defender Antivirus settings, such as switching Real-time protection off. It is not needed to turn protection on; turn it back On.',
      why: 'Leave Tamper protection on. It only has to be off to turn Real-time protection off, never to turn it on.',
      src: ['tamper', 'virusProtection'] },
  ],
  solution: [
    launch('windows security', 'Open Windows Security from Start search.'),
    act('nav-virus', null, null, 'Go to Virus & threat protection.'),
    act('nav-manage', null, null, 'Under Virus & threat protection settings, select Manage settings.'),
    set('rtp', true, 'Turn Real-time protection On. Leave Tamper protection On.'),
    act('settings-back', null, null, 'Go back to Virus & threat protection.'),
    act('quick-scan', null, null, 'Run a Quick scan: no signs of infection, so the quick scan fits.'),
    act('virus-back', null, null, 'Go back to Home.'),
    act('nav-fw', null, null, 'Open Firewall & network protection. Public network shows the firewall Off.'),
    act('profiles', 'public', 'open', 'Open Public network.'),
    set('fw-public-toggle', true, 'Turn Microsoft Defender Firewall On for Public network.'),
    launch('ms-settings:network-wifi', 'Open Settings > Network & internet > Wi-Fi.'),
    act('nav-cafe', null, null, 'Open CafeLumen properties.'),
    set('profile', 'Public network (Recommended)', 'Set Network profile type to Public network (Recommended): the laptop is hidden from others and the Public firewall rules apply.'),
  ],
  trapDemo: [
    launch('windows security'),
    act('nav-virus'),
    act('nav-manage'),
    set('tamper', false),
  ],
  src: ['firewall', 'virusProtection', 'rtpOff', 'tamper', 'defenderOffline', 'netSettings'],
};

export default [win01, win02, win03, win04, win05, win06, win07, win08];
