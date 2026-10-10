export const sources = {
  cisaHome: ['Home Network Security, CISA', 'https://www.cisa.gov/news-events/news/home-network-security'],
  cisaPasswords: ['Use Strong Passwords, CISA', 'https://www.cisa.gov/secure-our-world/use-strong-passwords'],
  ftcWifi: ['How To Secure Your Home Wi-Fi Network, FTC Consumer Advice', 'https://consumer.ftc.gov/articles/how-secure-your-home-wi-fi-network'],
  appleRouter: ['Recommended settings for Wi-Fi routers and access points, Apple Support', 'https://support.apple.com/en-us/102766'],
  cisaUpskill: ['Project Upskill Module 5: Securing Your Home Wi-Fi, CISA', 'https://www.cisa.gov/audiences/high-risk-communities/projectupskill/module5'],
  cisaWireless: ['Securing Wireless Networks, CISA', 'https://www.cisa.gov/news-events/news/securing-wireless-networks'],
  cisaEnterpriseWireless: ['Securing Enterprise Wireless Networks, CISA', 'https://www.cisa.gov/news-events/news/securing-enterprise-wireless-networks'],
  wfaWpa3: ['Wi-Fi CERTIFIED WPA3 Technology Overview (January 2021), Wi-Fi Alliance', 'https://www.wi-fi.org/system/files/Wi-Fi_CERTIFIED_WPA3_Technology_Overview_202101.pdf'],
  wfaDeploy: ['WPA3 and Wi-Fi Enhanced Open Deployment and Implementation Guide v1.1, Wi-Fi Alliance', 'https://www.wi-fi.org/system/files/WPA3%20and%20Wi-Fi%20Enhanced%20Open%20Deployment%20Guide%20v1.1.pdf'],
  ftcPhishing: ['How To Recognize and Avoid Phishing Scams, FTC Consumer Advice', 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams'],
  ngGuest: ['How do I set up a guest network on my Orbi WiFi System?, NETGEAR Support', 'https://kb.netgear.com/31579/How-do-I-set-up-a-guest-network-on-my-Orbi-WiFi-System'],
  ngDmz: ['What is the De-Militarized Zone (DMZ) feature on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/25891/What-is-the-De-Militarized-Zone-DMZ-feature-on-my-NETGEAR-router'],
  ngPortForward: ['How do I set up port forwarding to a local server on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/24289/How-do-I-set-up-port-forwarding-to-a-local-server-on-my-NETGEAR-router'],
  ngReserve: ['How do I reserve an IP address on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/25722/How-do-I-reserve-an-IP-address-on-my-NETGEAR-router'],
  ngDhcpPool: ['How do I specify the pool of IP addresses assigned by my Nighthawk router?, NETGEAR Support', 'https://kb.netgear.com/24089/How-do-I-specify-the-pool-of-IP-addresses-assigned-by-my-Nighthawk-router'],
  ngFirmware: ['How do I manually update the firmware on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/23960/How-do-I-manually-update-the-firmware-on-my-NETGEAR-router'],
  ngBlockSites: ['How do I block Internet sites on my NETGEAR router from the router web interface?, NETGEAR Support', 'https://kb.netgear.com/24053/How-do-I-block-Internet-sites-on-my-NETGEAR-router-from-the-router-web-interface'],
  ngSchedule: ['How do I set up a blocking schedule on my NETGEAR router from the router web interface?, NETGEAR Support', 'https://kb.netgear.com/24055/How-do-I-set-up-a-blocking-schedule-on-my-NETGEAR-router-from-the-router-web-interface'],
  ngDns: ['How do I set static Domain Name System servers on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/30510/How-do-I-set-static-Domain-Name-System-servers-on-my-NETGEAR-router'],
  cfFamilies: ['Set up 1.1.1.1 (1.1.1.1 for Families), Cloudflare Docs', 'https://developers.cloudflare.com/1.1.1.1/setup/'],
  cfIps: ['1.1.1.1 IP addresses, Cloudflare Docs', 'https://developers.cloudflare.com/1.1.1.1/ip-addresses/'],
  cfRouter: ['Set up 1.1.1.1 on a router, Cloudflare Docs', 'https://developers.cloudflare.com/1.1.1.1/setup/router/'],
  cfDohBrowsers: ['Configure DoH on your browser, Cloudflare Docs', 'https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/encrypted-dns-browsers/'],
  cfDnsPolicies: ['DNS policies, Cloudflare One Docs', 'https://developers.cloudflare.com/cloudflare-one/traffic-policies/dns-policies/'],
  ngManual: ['Nighthawk WiFi 7 Dual-Band Router RS150 User Manual (Block Sites keyword blocking), NETGEAR', 'https://www.downloads.netgear.com/files/GDC/RS150v2/RS150v2-140-130_UM_EN.pdf'],
  ngFwCheck: ['How do I update the firmware on my NETGEAR router?, NETGEAR Support', 'https://kb.netgear.com/en/000058238'],
  msNonBroadcast: ['Non-broadcast Wireless Networks with Microsoft Windows, Microsoft Learn (archived)', 'https://learn.microsoft.com/en-us/previous-versions/tn-archive/bb726942(v=technet.10)'],
  comptiaA2obj: ['CompTIA A+ Core 2 (220-1202) V15 Exam Objectives, objective 2.10 (Wireless specific: Disabling SSID broadcast), CompTIA', 'https://assets.ctfassets.net/82ripq7fjls2/6I8WL66IBa1AUovioDGrnM/f74a7eca336fd4e4c8e723a1f893086d/CompTIA-A-220-1202-Exam-Objectives-3.0.pdf'],
};

// Primer section bodies are plain text, or an array of plain-text paragraphs and tables
// (a table is an array of rows; the first row is the header).
export const primer = {
  title: 'SOHO router setup and hardening refresher',
  sections: [
    { h: 'Two different passwords', body: 'The router password (admin login) protects the settings pages. The Wi-Fi password protects who can join the wireless network. Change both from the defaults; default admin logins are published online or printed on the router label. CISA guidance for strong passwords: at least 16 characters, random, and a different password for each account. A passphrase of 5 to 7 unrelated random words, or a password-manager-generated value, works. Length alone is not enough: sixteen repeated characters or a common word like password are still easy to guess, and these labs reject them.' },
    { h: 'Pick the wireless security mode', body: [
      'On one network name (SSID), choose the strongest mode every device on that network supports. When WPA2-only devices must stay, a separate WPA2 SSID with a different password is stronger than sharing one transitional SSID, if the router supports it.',
      [
        ['Security mode', 'Use it when'],
        ['WPA3 Personal', 'Every device supports WPA3. Strongest: its SAE handshake resists offline password guessing and gives forward secrecy.'],
        ['WPA2/WPA3 Transitional', 'Some devices support only WPA2. WPA3 devices use WPA3 and WPA2 devices fall back to WPA2, with one name and one password.'],
        ['WPA2 Personal (AES)', 'Only when nothing better is possible, for example a separate network for WPA2-only gadgets.'],
        ['WPA/WPA2 (TKIP), WEP, None (open)', 'Never. TKIP and WEP are weak legacy settings and None has no password at all.'],
      ],
    ] },
    { h: 'The transitional trade-off', body: 'Transitional mode is convenient, but the Wi-Fi Alliance points out its cost: the shared password can be found with an offline dictionary attack against a WPA2 device, and an attacker who has it can join the network with WPA2. Move to WPA3 Personal only once every device supports it. Where WPA2-only devices must stay, the Wi-Fi Alliance describes a stronger option: a second network (SSID) for them with a different password, so the WPA3 password is never used with WPA2.' },
    { h: 'Turn off the shortcuts', body: 'WPS (Wi-Fi Protected Setup) lets a device join with a button press or a PIN instead of typing the Wi-Fi password. The push-button method needs someone at the router, but the WPS PIN method has a known authentication weakness, and WPS is one more enrollment path to manage; CISA says to disable it when it is not needed. UPnP lets programs on the network open firewall ports by themselves; CISA notes malware has used it to bypass router firewalls, so disable it unless you have a specific need. Remote management makes the admin pages reachable from the internet; CISA and the FTC say to turn it off.' },
    { h: 'Firmware from the manufacturer only', body: 'Firmware updates fix flaws and security vulnerabilities. Use the router update check, or download the file yourself from the manufacturer support site for your exact model; some routers can update automatically. A link in an unexpected email is not a trusted source: go to a website you know is real instead. Do not turn the router off while an update installs.' },
    { h: 'Separate networks: guest and IoT', body: 'A guest network has its own name and its own long, unique password, so visitors never learn the main password. Turn off the option that lets guests reach the local network, so guests get the internet only. CISA also suggests putting smart devices that only need the internet (thermostats, cameras, speakers) on a separate network with its access to the main network turned off, so a compromised device cannot discover or attack your computers. A separate network name alone is not isolation: check the setting that allows access to the local network.' },
    { h: 'Letting the internet reach one device', body: [
      'First give the device a DHCP reservation so its address never changes, then open only what it needs.',
      [
        ['Feature', 'What it opens', 'Use it?'],
        ['Port forwarding', 'One port and protocol, to one internal IP address', 'Yes, for a device that must be reached from outside'],
        ['UPnP', 'Whatever any program on the network asks for, without asking you', 'No, turn it off'],
        ['DMZ host (Default DMZ Server)', 'All inbound traffic to one device, with the router firewall protection removed for it', 'Avoid'],
      ],
      'A home router DMZ setting is a single exposed host, not a real screened subnet (a separate network segment for public servers).',
    ] },
    { h: 'DHCP pool, reservations and static addresses', body: 'The router DHCP server hands out addresses from its pool (Starting IP Address to Ending IP Address). A reservation ties one address to one device MAC address, so that device always gets the same address. A device you set up with a static address must use an address outside the pool, or DHCP may give the same address to another device. Keep the router DHCP server on when it is the only one on the network.' },
    { h: 'Content filtering and schedules', body: [
      'Router Block Sites rules block keywords or domains. On the NETGEAR-style control shown here, keyword blocking works for HTTP URLs only; it does not block HTTPS URLs, and almost every site today uses HTTPS. A block at the DNS lookup stage refuses the name before any connection starts, so it works for HTTPS too (Cloudflare: DNS policies work across all protocols, not just web browsers). The simulated router in these labs has a Domain Filter that works that way. Whatever tool you use, test the site with an https:// address during the blocked hours and outside them.',
      'Blocking modes: Never turns blocking off, Always blocks all the time, and Per Schedule blocks only during the Schedule days and hours. The schedule runs on the router clock, so set the time zone and daylight saving option.',
      'DNS filtering blocks whole categories for devices whose DNS queries actually reach that resolver: point the router at a filtering service and enter both of its addresses (either order; the two addresses are redundant peers). Client overrides and encrypted DNS need separate controls: a device with its own DNS servers, a browser using secure DNS (DNS over HTTPS), or IPv6 DNS set elsewhere can bypass the router setting.',
      [
        ['DNS addresses (Cloudflare)', 'What they block'],
        ['1.1.1.1 and 1.0.0.1', 'Standard resolver, not the Families filtering service'],
        ['1.1.1.2 and 1.0.0.2 (1.1.1.1 for Families)', 'Malware'],
        ['1.1.1.3 and 1.0.0.3 (1.1.1.1 for Families)', 'Malware and adult content'],
      ],
    ] },
    { h: 'Looks secure, is not', body: [
      'MAC address filtering: MAC addresses are easy to copy or spoof, and filtering does not stop anyone monitoring traffic, so do not rely on it.',
      'Disabling SSID broadcast is a real router setting, and the CompTIA A+ Core 2 objectives list it under objective 2.10 (security settings on SOHO wireless networks), so know what it does: the router stops putting the network name in its beacons, and people must type the name to join. It is not a security control. Microsoft explains that a non-broadcast network is not undetectable: its name still travels in the probe requests devices send and in the router replies, and devices set to join a hidden network keep announcing its name. Wireless security comes from authentication and encryption, so hiding the name never replaces WPA3 (or WPA2 AES) with a strong passphrase. Microsoft and Apple both recommend leaving the name broadcast.',
      'Real protection is WPA3 (or WPA2 AES), strong passwords, updated firmware and the shortcuts turned off.',
    ] },
  ],
  src: ['cisaHome', 'cisaPasswords', 'ftcWifi', 'appleRouter', 'msNonBroadcast', 'comptiaA2obj', 'cisaUpskill', 'wfaWpa3', 'wfaDeploy', 'ngDmz', 'ngPortForward', 'ngDhcpPool', 'ngFirmware', 'ngFwCheck', 'ngBlockSites', 'ngManual', 'ngSchedule', 'cfFamilies', 'cfIps', 'cfRouter', 'cfDohBrowsers', 'cfDnsPolicies', 'ftcPhishing'],
};

export const terms = {
  SSID: 'Service Set Identifier: the name that identifies a Wi-Fi network, whether or not the router advertises that name in beacons.',
  'WPA3 Personal': 'The current Wi-Fi password-based security mode. Its SAE handshake protects better against password guessing than WPA2.',
  'WPA2/WPA3 Transitional': 'A mode that lets WPA3 devices use WPA3 while older devices connect with WPA2, using the same network name and password.',
  SAE: 'Simultaneous Authentication of Equals: the WPA3 Personal handshake. An attacker gets only one password guess per attempt against the network, and recorded traffic stays private even if the password later leaks.',
  WPS: 'Wi-Fi Protected Setup: joins a device with a button press or PIN instead of the Wi-Fi password. Disable it.',
  'remote management': 'A router setting that allows its admin pages to be reached from the internet.',
  firmware: 'The software built into the router. Updates come from the manufacturer and fix security flaws.',
  'guest network': 'A separate Wi-Fi network for visitors. Give it its own password and disable access to the main local network so guests get internet access without reaching private devices.',
  'IoT network': 'A separate Wi-Fi network for smart devices (thermostats, cameras, intercoms). Restrict its access to the main network when those devices need only the internet.',
  NVR: 'Network video recorder: a box that records the security cameras and lets an app view them.',
  'DHCP reservation': 'A router setting that always gives one device (identified by its MAC address) the same IP address.',
  'DHCP pool': 'The range of addresses the router DHCP server hands out, from the Starting IP Address to the Ending IP Address.',
  'port forwarding': 'A router rule that sends traffic arriving from the internet on one port to one device on the local network.',
  UPnP: 'Universal Plug and Play: lets devices and programs open ports in the router firewall by themselves. Disable it unless you need it.',
  'DMZ host': 'A home router setting (often Default DMZ Server) that sends all inbound internet traffic to one device, removing the router firewall protection for it.',
  'content filtering': 'Blocking sites or categories of sites, on the router or through a filtering DNS service.',
  'DNS filtering': 'Using a DNS service that refuses to look up names of blocked sites, such as malware or adult content. It works for HTTPS sites too, but only for devices whose DNS lookups reach that service.',
  'keyword blocking': 'A router Block Sites feature that blocks web addresses containing a keyword or domain. On the NETGEAR-style control in these labs it works only for http:// addresses, not https:// ones.',
  'Domain Filter': 'In these simulated labs, a router feature that refuses DNS lookups for listed domains, on a schedule if you choose, so the sites are blocked for HTTP and HTTPS alike on devices that use the router for DNS.',
  'MAC address filtering': 'Allowing only listed hardware (MAC) addresses to join. Weak: addresses are easy to copy.',
};

const SECURITY_MODES = ['None', 'WEP', 'WPA/WPA2 Personal (TKIP)', 'WPA2 Personal (AES)', 'WPA2/WPA3 Transitional', 'WPA3 Personal'];
const WEAK_MODES = ['None', 'WEP', 'WPA/WPA2 Personal (TKIP)'];
// Password grading: length (CISA: at least 16) plus a separate not-guessable test that rejects
// whitespace-only values, a character repeated 4 or more times in a row, a short chunk (2-6 characters)
// repeated 3 times in a row (abababab, 1234 1234 1234), a value that is one chunk repeated end to end
// (harbor2019harbor2019), alphabet, number and keyboard runs anywhere (abcdef, 987654, qwerty, 1q2w3e),
// and values built only from common passwords plus digits and symbols (Password1234!, admin-admin-2024).
// A common word inside a longer word (badminton, unwelcome) is allowed.
// A regex cannot prove randomness, so the copy never calls a checked value random.
const LONG = '^.{16,63}$';
const caseless = (word) => [...word].map((ch) => (/[a-z]/i.test(ch) ? `[${ch.toUpperCase()}${ch.toLowerCase()}]` : ch)).join('');
const RUNS = ['123456', '654321', '987654', 'abc123', 'abcdef', 'zyxwvu', 'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1q2w3e'];
const COMMON = ['password', 'passw0rd', 'letmein', 'iloveyou', 'admin', 'welcome', 'football', 'monkey', 'dragon', 'sunshine', 'trustno1'];
const NOT_GUESSABLE = `^(?=[\\s\\S]*\\S)(?![\\s\\S]*(.)\\1{3})(?![\\s\\S]*(.{2,6})\\2\\2)(?!([\\s\\S]+)\\3+$)(?![\\s\\S]*(?:${RUNS.map(caseless).join('|')}))(?!(?:[\\W\\d_]*(?:${COMMON.map(caseless).join('|')}))+[\\W\\d_]*$)`;
const strongPassword = (key) => [
  { key, op: 'matches', value: LONG },
  { key, op: 'matches', value: NOT_GUESSABLE },
  { not: { key, op: 'repeatedFold' } },
];
// Typed a new password that fails the length or not-guessable test, or any extra case-specific test
// (empty and unchanged values do not count).
const weakNewPassword = (key, original, extra = []) => ({ all: [{ key, op: 'ne', value: original }, { key, op: 'ne', value: '' }, { not: { all: [...strongPassword(key), ...extra] } }] });
// Case-specific password tests (sim ops fold case, spaces and punctuation): the password does not
// contain the business name or a current network name (ssidKeys: every SSID of the case), and it is not a
// near copy of the other password (at most 3 single-character edits apart; identical passwords are the
// equal-password trap).
const NEAR_EDITS = 3;
const noNames = (key, names, ssidKeys = ['wifi.ssid']) => [{ not: { key, op: 'hasText', value: names } }, ...ssidKeys.map((ssid) => ({ not: { key, op: 'hasKey', value: ssid } }))];
const notNear = (key, otherKey) => ({ not: { all: [{ key, op: 'nearKey', value: otherKey, max: NEAR_EDITS }, { not: { key, op: 'eqKey', value: otherKey } }] } });
// Two passwords must differ: sim op 'eqKey' compares state[key] to state[otherKey].
const differentFrom = (key, otherKey) => ({ not: { key, op: 'eqKey', value: otherKey } });
// Trap check: two non-empty passwords are identical.
const samePassword = (key, otherKey) => ({ all: [{ key, op: 'eqKey', value: otherKey }, { key, op: 'ne', value: '' }] });
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

const HARBOR_NAMES = ['Harbor Dental'];
const HARBOR_ADMIN_EXTRA = [...noNames('admin.password', HARBOR_NAMES), notNear('admin.password', 'wifi.password')];
const HARBOR_WIFI_EXTRA = [...noNames('wifi.password', HARBOR_NAMES), notNear('wifi.password', 'admin.password')];

const router01 = {
  id: 'router-01', title: 'Lock down a new office router', level: 1, minutes: 6,
  scenario: 'Harbor Dental just installed a new router. Its admin login is still the factory admin/admin, and the Wi-Fi network HarborDental uses WPA2 Personal with the old password harbor2019. Every device in the office supports WPA3 except the two front-desk label printers, which support only WPA2 Personal. Secure the router so every device still connects.',
  examObjs: { 'aplus-1202': ['2.3', '2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'admin.password': 'admin', 'admin.remote': 'Disabled',
    'wifi.ssid': 'HarborDental', 'wifi.security': 'WPA2 Personal (AES)', 'wifi.password': 'harbor2019',
    wps: 'Enabled',
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['Firmware version', '2.1.8 (up to date)'], ['Network name (SSID)', '{{wifi.ssid}}'], ['Wireless security', '{{wifi.security}}'], ['WPS', '{{wps}}'], ['Remote management', '{{admin.remote}}']] },
    ] },
    { id: 'wireless', title: 'Wireless', crumbs: ['Wireless'], controls: [
      { id: 'ssid', type: 'text', label: 'Network name (SSID)', key: 'wifi.ssid' },
      { id: 'security', type: 'select', label: 'Security', key: 'wifi.security', options: SECURITY_MODES },
      { id: 'wifi-password', type: 'password', label: 'Wi-Fi password', key: 'wifi.password', disabledIf: { key: 'wifi.security', op: 'eq', value: 'None' } },
    ] },
    { id: 'wps', title: 'WPS', crumbs: ['Wireless', 'WPS'], controls: [
      { id: 'wps', type: 'select', label: 'WPS (Wi-Fi Protected Setup)', key: 'wps', options: ['Enabled', 'Disabled'] },
    ] },
    { id: 'administration', title: 'Administration', crumbs: ['Advanced', 'Administration'], controls: [
      { id: 'login', type: 'info', text: 'Router login user name: admin' },
      { id: 'admin-password', type: 'password', label: 'Router password', key: 'admin.password' },
      { id: 'remote', type: 'select', label: 'Remote management', key: 'admin.remote', options: ['Disabled', 'Enabled'] },
    ] },
  ],
  goals: [
    { id: 'admin-password', text: 'Replace the default router password', check: { all: [...strongPassword('admin.password'), ...HARBOR_ADMIN_EXTRA, { key: 'admin.password', op: 'ne', value: 'admin' }, differentFrom('admin.password', 'wifi.password')] },
      why: 'Default router logins are published online and printed on the device label. Anyone who joins the network could log in with admin/admin and change every setting, including turning security off.',
      expect: 'The router password is no longer admin; it is a new password of 16 or more characters that does not contain the business or network name and is not the Wi-Fi password or a near copy of it. Choose unrelated random words or a password-manager-generated value, and do not reuse it.',
      hints: ['The router has its own login, separate from the Wi-Fi password, and it is still the factory default.', 'Open Administration and change the router password.', 'Administration > Router password: type a new passphrase of 16 or more characters that is not the Wi-Fi password, for example five unrelated random words with a number.'],
      src: ['cisaHome', 'cisaPasswords', 'ftcWifi'] },
    { id: 'security-mode', text: 'Choose the strongest mode that keeps every device connected on this single SSID', check: { key: 'wifi.security', op: 'eq', value: 'WPA2/WPA3 Transitional' },
      why: 'WPA3 Personal is strongest, but the label printers support only WPA2 and would drop off. WPA2/WPA3 Transitional lets WPA3 devices use WPA3 while the printers fall back to WPA2. A separate WPA2 SSID with a different password and limited access to the WPA3 network is stronger when the router supports it; this case configures one SSID.',
      expect: 'Wireless > Security is WPA2/WPA3 Transitional.',
      hints: ['Most devices support WPA3, but two printers support only WPA2.', 'Open Wireless and pick the mode that lets WPA3 and WPA2 devices share one network.', 'Wireless > Security > WPA2/WPA3 Transitional.'],
      src: ['appleRouter', 'cisaHome', 'wfaWpa3', 'wfaDeploy'] },
    { id: 'wifi-password', text: 'Set a strong new Wi-Fi password', check: { all: [...strongPassword('wifi.password'), ...HARBOR_WIFI_EXTRA, { not: { key: 'wifi.password', op: 'matches', value: caseless('harbor2019') } }] },
      why: 'Changing the security mode does not change who already knows the old password. A new long, unique password keeps former staff and neighbors off the network.',
      expect: 'The Wi-Fi password is a new password of 16 or more characters that does not contain the old harbor2019 or the business or network name, and is not a near copy of the router password. Choose unrelated random words or a password-manager-generated value, and do not reuse it.',
      hints: ['The old Wi-Fi password is short and widely known.', 'Open Wireless and replace the Wi-Fi password.', 'Wireless > Wi-Fi password: type a new passphrase of 16 or more characters that you do not use anywhere else.'],
      src: ['cisaPasswords', 'ftcWifi'] },
  ],
  traps: [
    { id: 'wps-on', critical: true, check: { key: 'wps', op: 'eq', value: 'Enabled' },
      message: 'WPS is still Enabled. It lets a device join with a button press or a PIN instead of the Wi-Fi password, and a design flaw in WPS PIN authentication lets attackers recover the PIN. If PIN-based WPS is available, an attacker may exploit its PIN weakness even when the Wi-Fi password is strong. Set Wireless > WPS to Disabled.',
      why: 'Disable WPS when it is not needed. The WPS PIN method has a known authentication weakness, and WPS provides another enrollment path to manage.',
      src: ['cisaHome', 'ftcWifi'] },
    { id: 'weak-security', critical: true, check: { key: 'wifi.security', op: 'in', value: WEAK_MODES },
      message: 'That security mode is obsolete or open. None lets anyone join, and WEP and TKIP are weak legacy settings. Use WPA3 Personal, or WPA2/WPA3 Transitional when some devices support only WPA2.',
      why: 'Never step down to WEP, TKIP or open Wi-Fi to make an old device connect; use transitional mode or replace the device.',
      src: ['appleRouter', 'ftcWifi'] },
    { id: 'remote-on', check: { key: 'admin.remote', op: 'eq', value: 'Enabled' },
      message: 'Remote management is now Enabled, so the router admin pages can be reached from the internet. Nobody asked for remote access. Set Administration > Remote management to Disabled.',
      why: 'Turn off router features nobody needs, especially ones that expose the admin login to the internet.',
      src: ['ftcWifi', 'cisaHome'] },
    { id: 'weak-password', check: { any: [weakNewPassword('admin.password', 'admin', HARBOR_ADMIN_EXTRA), weakNewPassword('wifi.password', 'harbor2019', HARBOR_WIFI_EXTRA)] },
      message: 'That new password is too short or easy to guess: it is under 16 characters, repeats a character or a short chunk, contains a keyboard or number run such as qwerty or 123456, is made only of common passwords such as password or admin plus numbers and symbols, contains the business or network name (Harbor Dental, HarborDental), or is the other password with only a few characters changed. CISA says to use at least 16 characters, random, and never reused. Type a passphrase of 5 to 7 unrelated random words, or a password-manager-generated value, and give each password its own.',
      why: 'Length alone is not strength: a long run of one character, a common word, or the name of the business or its network is guessed first, and a near copy of one password falls with the other. Use 16 or more characters of unrelated random words or generated text for each password.',
      src: ['cisaPasswords'] },
    { id: 'equal-password', check: samePassword('admin.password', 'wifi.password'),
      message: 'The router password and the Wi-Fi password are the same. Everyone who is given the Wi-Fi password, including visitors and staff who later leave, could log in to the router admin pages and change every setting, including turning security off. CISA says to use a different password for each account. Give the router login its own passphrase of 16 or more characters.',
      why: 'The router login and the Wi-Fi password protect different things and are shared with different people. Reusing one password means whoever knows the Wi-Fi password also controls the router.',
      src: ['cisaPasswords', 'cisaHome'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'administration' }, explain: 'Start with the router login: open Administration.' },
    { do: { type: 'set', controlId: 'admin-password', value: 'Copper-Lantern-Tide-47' }, explain: 'Replace admin with a unique passphrase of 16 or more characters.' },
    { do: { type: 'open', screenId: 'wireless' }, explain: 'Open Wireless to set the security mode and the Wi-Fi password.' },
    { do: { type: 'set', controlId: 'security', value: 'WPA2/WPA3 Transitional' }, explain: 'Transitional mode keeps the WPA2-only printers connected while every other device uses WPA3.' },
    { do: { type: 'set', controlId: 'wifi-password', value: 'quiet-pylon-ferns-sail-9' }, explain: 'Replace the old, widely known Wi-Fi password with a new long one.' },
    { do: { type: 'open', screenId: 'wps' }, explain: 'Check the shortcut features: open Wireless > WPS.' },
    { do: { type: 'set', controlId: 'wps', value: 'Disabled' }, explain: 'Disable WPS: nobody needs it here, and its PIN method has a known weakness.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'wireless' } },
    { do: { type: 'set', controlId: 'security', value: 'WEP' } },
    { do: { type: 'set', controlId: 'wifi-password', value: 'aaaaaaaaaaaaaaaa' } },
    { do: { type: 'open', screenId: 'administration' } },
    { do: { type: 'set', controlId: 'remote', value: 'Enabled' } },
    { do: { type: 'set', controlId: 'admin-password', value: 'password12345678' } },
    { do: { type: 'set', controlId: 'admin-password', value: 'aaaaaaaaaaaaaaaa' } },
  ],
  src: ['cisaHome', 'cisaPasswords', 'ftcWifi', 'appleRouter'],
};

const BAKERY_STAFF_PASSWORD = 'Oven-Copper-Lane-Rye-22';
const BAKERY_NAMES = ['Maple Street'];
const BAKERY_SSIDS = ['wifi.ssid', 'guest.ssid'];
const BAKERY_WIFI_EXTRA = [...noNames('wifi.password', BAKERY_NAMES, BAKERY_SSIDS), notNear('wifi.password', 'guest.password')];
const BAKERY_GUEST_EXTRA = [...noNames('guest.password', BAKERY_NAMES, BAKERY_SSIDS), notNear('guest.password', 'wifi.password')];

const router02 = {
  id: 'router-02', title: 'Guest Wi-Fi for customers', level: 1, minutes: 6,
  scenario: 'Maple Street Bakery gives customers the staff Wi-Fi password, and that network also connects the office PC and the card terminal. The owner wants customers on their own Wi-Fi that reaches the internet but nothing in the shop, with its own password. Customers bring all kinds of phones, old and new. Keep the staff network name and security mode, but replace its password because customers already know it.',
  examObjs: { 'aplus-1202': ['2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'wifi.ssid': 'MapleStreet-Staff', 'wifi.security': 'WPA2/WPA3 Transitional', 'wifi.password': BAKERY_STAFF_PASSWORD,
    'guest.enabled': false, 'guest.ssid': 'MapleStreet-Guest', 'guest.lan': true, 'guest.security': 'None', 'guest.password': '',
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['Network name (SSID)', '{{wifi.ssid}}'], ['Wireless security', '{{wifi.security}}'], ['Guest network name (SSID)', '{{guest.ssid}}'], ['Guest network security', '{{guest.security}}'], ['Attached devices', 'OFFICE-PC, CARD-TERMINAL, 6 phones']] },
    ] },
    { id: 'wireless', title: 'Wireless', crumbs: ['Wireless'], controls: [
      { id: 'ssid', type: 'text', label: 'Network name (SSID)', key: 'wifi.ssid' },
      { id: 'security', type: 'select', label: 'Security', key: 'wifi.security', options: SECURITY_MODES },
      { id: 'wifi-password', type: 'password', label: 'Wi-Fi password', key: 'wifi.password', disabledIf: { key: 'wifi.security', op: 'eq', value: 'None' } },
    ] },
    { id: 'guest', title: 'Guest Network', crumbs: ['Wireless', 'Guest Network'], controls: [
      { id: 'guest-enable', type: 'toggle', label: 'Enable Guest Network', key: 'guest.enabled' },
      { id: 'guest-ssid', type: 'text', label: 'Guest Wireless Network Name (SSID)', key: 'guest.ssid' },
      { id: 'guest-lan', type: 'toggle', label: 'Allow guests to see each other and access my local network', key: 'guest.lan' },
      { id: 'guest-security', type: 'select', label: 'Security', key: 'guest.security', options: SECURITY_MODES },
      { id: 'guest-password', type: 'password', label: 'Guest Wi-Fi password', key: 'guest.password', disabledIf: { key: 'guest.security', op: 'eq', value: 'None' } },
    ] },
  ],
  goals: [
    { id: 'rotate-staff-password', text: 'Replace the known staff password while keeping its name and security mode', check: { all: [...strongPassword('wifi.password'), ...BAKERY_WIFI_EXTRA, { key: 'wifi.password', op: 'ne', value: BAKERY_STAFF_PASSWORD }, { key: 'wifi.security', op: 'eq', value: 'WPA2/WPA3 Transitional' }, { key: 'wifi.ssid', op: 'eq', value: 'MapleStreet-Staff' }] },
      why: 'A guest network does not revoke the staff password customers already know. Change that password and reconnect staff devices before giving customers the guest password. Keep the staff network on Transitional security so WPA3 devices still use WPA3 and older devices use WPA2.',
      expect: 'Wireless > Wi-Fi password is new, at least 16 characters, does not contain the business or a network name (Maple Street, MapleStreet-Staff, MapleStreet-Guest) and is not a near copy of the guest password. Choose unrelated random words or a password-manager-generated value, and do not reuse it. Wireless > Security remains WPA2/WPA3 Transitional and the network name stays MapleStreet-Staff, so staff devices only need the new password.',
      hints: ['Customers still know the staff password.', 'Change the staff Wi-Fi password, then reconnect staff devices without changing the security mode.', 'Wireless > Security > WPA2/WPA3 Transitional; Wi-Fi password: set a new, unique passphrase of at least 16 characters.'],
      src: ['ftcWifi', 'cisaUpskill'] },
    { id: 'guest-isolated', text: 'Turn on a guest network that cannot reach the shop devices', check: { all: [{ key: 'guest.enabled', op: 'eq', value: true }, { key: 'guest.lan', op: 'eq', value: false }] },
      why: 'A guest network is a separate wireless network with its own name and password, but it protects the shop only if guests cannot reach shop devices. With local network access allowed, a customer phone, or malware on it, can reach the office PC and the card terminal. With it off, guests get the internet only. CISA says to keep guest traffic away from the main network, and NETGEAR leaves this option off by default for privacy.',
      expect: 'Guest Network: Enable Guest Network is on and Allow guests to see each other and access my local network is off.',
      hints: ['Customers need a network of their own, and it only helps if they cannot reach the office PC and card terminal.', 'Open Guest Network, turn off the option that lets guests reach the local network, and switch the guest network on.', 'Guest Network > Allow guests to see each other and access my local network: off; Enable Guest Network: on.'],
      src: ['cisaEnterpriseWireless', 'ngGuest', 'cisaUpskill', 'ftcWifi'] },
    { id: 'guest-security', text: 'Encrypt the guest network for every kind of phone', check: { key: 'guest.security', op: 'eq', value: 'WPA2/WPA3 Transitional' },
      why: 'Guest does not mean open. An open network (Security: None) has no password, so anyone in range can join. Customers bring every kind of phone, so WPA2/WPA3 Transitional is the pick: newer phones use WPA3 and older ones fall back to WPA2. Use WPA3 Personal only on a guest network when every intended guest device is known to support it; that is not established in this ticket.',
      expect: 'Guest Network > Security is WPA2/WPA3 Transitional.',
      hints: ['The guest network currently has no security at all.', 'On Guest Network, pick a security mode that both new and older phones can use.', 'Guest Network > Security > WPA2/WPA3 Transitional.'],
      src: ['appleRouter', 'cisaUpskill'] },
    { id: 'guest-password', text: 'Give the guest network its own strong password', check: { all: [...strongPassword('guest.password'), ...BAKERY_GUEST_EXTRA, { key: 'guest.password', op: 'ne', value: BAKERY_STAFF_PASSWORD }, differentFrom('guest.password', 'wifi.password')] },
      why: 'CISA says the guest Wi-Fi gets its own long, random, unique password. If it matched the staff password, anyone with the guest password could join the staff network too, and the separation would be gone.',
      expect: 'The guest Wi-Fi password is a new password of 16 or more characters, different from the old and the new staff Wi-Fi password and not a near copy of it, that does not contain the business or a network name (Maple Street, MapleStreet-Staff, MapleStreet-Guest). Choose unrelated random words or a password-manager-generated value, and do not reuse it.',
      hints: ['Customers will see this password, so it must not be a staff one.', 'On Guest Network, set a security mode first, then type a new long password that is not the staff password.', 'Guest Network > Guest Wi-Fi password: type a new passphrase of 16 or more characters, for example warm-gravel-comet-dawn-41.'],
      src: ['cisaUpskill', 'cisaPasswords'] },
  ],
  traps: [
    { id: 'weak-security', critical: true, check: { any: [{ key: 'wifi.security', op: 'in', value: WEAK_MODES }, { all: [{ key: 'guest.enabled', op: 'eq', value: true }, { key: 'guest.security', op: 'in', value: WEAK_MODES }] }] },
      message: 'A network is now open or using WEP or TKIP. With Security set to None anyone in range can join (the guest network, or worse the staff network with the office PC and the card terminal), and WEP and TKIP are weak legacy settings. Keep the staff network on WPA2/WPA3 Transitional and set Guest Network > Security to WPA2/WPA3 Transitional with its own password. Tip: set security before you switch a new network on.',
      why: 'Guest does not mean open, and keeping the staff security mode means changing only its password: never None, WEP or TKIP.',
      src: ['cisaUpskill', 'appleRouter', 'ftcWifi'] },
    { id: 'same-password', check: { key: 'guest.password', op: 'eq', value: BAKERY_STAFF_PASSWORD },
      message: 'The guest password is the staff Wi-Fi password customers already know. Anyone who reads it off the counter sign can join the staff network, which defeats the separate guest network. Give the guest network a different password.',
      why: 'Each network gets its own password; never reuse the staff password for guests.',
      src: ['cisaUpskill', 'cisaPasswords'] },
    { id: 'staff-password-known', check: { all: [{ key: 'guest.enabled', op: 'eq', value: true }, { key: 'wifi.password', op: 'eq', value: BAKERY_STAFF_PASSWORD }] },
      message: 'The guest network is on, but the staff Wi-Fi password is still the one customers were given. They can keep joining the staff network and reach the office PC and the card terminal. A guest network does not revoke a password: change Wireless > Wi-Fi password and reconnect the staff devices.',
      why: 'Adding a guest network does not take back a password people already know. Rotate the shared password first.',
      src: ['ftcWifi', 'cisaUpskill'] },
    { id: 'guest-wpa3-only', check: { key: 'guest.security', op: 'eq', value: 'WPA3 Personal' },
      message: 'WPA3 Personal on the guest network locks out every customer phone that supports only WPA2, and this ticket says customers bring all kinds of phones. Use WPA2/WPA3 Transitional on the guest network.',
      why: 'Pick the strongest mode the intended devices actually support; for unknown guest phones that is WPA2/WPA3 Transitional.',
      src: ['appleRouter'] },
    { id: 'weak-password', check: { any: [weakNewPassword('wifi.password', BAKERY_STAFF_PASSWORD, BAKERY_WIFI_EXTRA), weakNewPassword('guest.password', '', BAKERY_GUEST_EXTRA)] },
      message: 'That new password is too short or easy to guess: it is under 16 characters, repeats a character or a short chunk, contains a keyboard or number run such as qwerty or 123456, is made only of common passwords such as password or admin plus numbers and symbols, contains the business or a network name (Maple Street, MapleStreet-Staff, MapleStreet-Guest), or is the other Wi-Fi password with only a few characters changed. Customers read the guest password off the counter sign, so a guest password that differs from the staff one by a character or two hands them the staff password. CISA says to use at least 16 characters, random, and never reused. Type a passphrase of 5 to 7 unrelated random words, or a password-manager-generated value, and give each network its own.',
      why: 'Length alone is not strength: a long run of one character, a common word, or the name of the business or its network is guessed first, and a near copy of one password falls with the other.',
      src: ['cisaPasswords'] },
    { id: 'equal-password', check: { all: [samePassword('guest.password', 'wifi.password'), { key: 'guest.password', op: 'ne', value: BAKERY_STAFF_PASSWORD }] },
      message: 'The guest Wi-Fi password and the staff Wi-Fi password are the same. Customers read the guest password off the counter sign and could use it to join the staff network and reach the office PC and the card terminal, so the separate guest network protects nothing. CISA says the guest network gets its own unique password. Give the guest network and the staff network different passphrases.',
      why: 'Each network gets its own password. Reusing one password across the guest and staff networks undoes the separation.',
      src: ['cisaUpskill', 'cisaPasswords'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'wireless' }, explain: 'Open Wireless first: customers already know the staff password, so it has to change.' },
    { do: { type: 'set', controlId: 'wifi-password', value: 'Tulip-Lantern-Basalt-Quartz-64' }, explain: 'Replace the staff Wi-Fi password with a new long one. Name and security mode stay; staff devices reconnect with the new password.' },
    { do: { type: 'open', screenId: 'guest' }, explain: 'Open Wireless > Guest Network.' },
    { do: { type: 'set', controlId: 'guest-security', value: 'WPA2/WPA3 Transitional' }, explain: 'Set security before switching the network on, so it is never open. Transitional fits every customer phone, new or old.' },
    { do: { type: 'set', controlId: 'guest-password', value: 'warm-gravel-comet-dawn-41' }, explain: 'Give guests their own long password, different from both staff passwords.' },
    { do: { type: 'set', controlId: 'guest-lan', value: false }, explain: 'Turn off guest access to the local network so guests reach the internet only.' },
    { do: { type: 'set', controlId: 'guest-enable', value: true }, explain: 'Now switch the guest network on. It is encrypted, has its own password and is isolated from the shop devices.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'guest' } },
    { do: { type: 'set', controlId: 'guest-enable', value: true } },
    { do: { type: 'set', controlId: 'guest-security', value: 'WPA3 Personal' } },
    { do: { type: 'set', controlId: 'guest-password', value: BAKERY_STAFF_PASSWORD } },
    { do: { type: 'set', controlId: 'guest-password', value: 'qwertyqwerty1234' } },
    { do: { type: 'set', controlId: 'guest-password', value: 'Maple-Street-Bakery-Guests' } },
    { do: { type: 'set', controlId: 'guest-password', value: 'Tulip-Lantern-Basalt-Quartz-64' } },
    { do: { type: 'open', screenId: 'wireless' } },
    { do: { type: 'set', controlId: 'wifi-password', value: 'Tulip-Lantern-Basalt-Quartz-64' } },
    { do: { type: 'open', screenId: 'guest' } },
    { do: { type: 'set', controlId: 'guest-security', value: 'None' } },
  ],
  src: ['cisaUpskill', 'cisaEnterpriseWireless', 'ngGuest', 'appleRouter', 'cisaPasswords', 'ftcWifi'],
};

const NVR_MAC = '^\\s*00[:-]?00[:-]?5[Ee][:-]?00[:-]?53[:-]?50\\s*$';
const NVR_RESERVATION_TYPED = { all: [
  { key: 'resv.ip', op: 'matches', value: '^\\s*192\\.168\\.1\\.50\\s*$' },
  { key: 'resv.mac', op: 'matches', value: NVR_MAC },
] };

const router03 = {
  id: 'router-03', title: 'Remote viewing for a camera recorder', level: 2, minutes: 8,
  scenario: 'Ridgeline Auto Repair has a network video recorder (NVR) for its shop cameras, and the owner wants to watch them on his phone when he is away. In this simulated ticket, the NVR documentation specifies TCP port 8443 for its viewing app. The NVR gets its address from DHCP, and it came up on a different address after the last power outage. Make remote viewing work while opening as little as possible.',
  examObjs: { 'aplus-1201': ['2.6'], 'aplus-1202': ['2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'nvr.type': 'DHCP', 'resv.nvr': '', 'resv.ip': '', 'resv.mac': '', 'resv.name': '',
    'pf.enabled': false, 'pf.name': '', 'pf.proto': 'TCP', 'pf.ext': null, 'pf.ip': '', 'pf.int': null,
    upnp: true, 'dmz.enabled': false, 'dmz.ip': '', 'admin.remote': 'Disabled',
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['Internet IP address', '203.0.113.24'], ['Router LAN IP address', '192.168.1.1'], ['DHCP pool', '192.168.1.2 to 192.168.1.254'], ['Remote management', '{{admin.remote}}']] },
    ] },
    { id: 'lan', title: 'LAN Setup', crumbs: ['Advanced', 'Setup', 'LAN Setup'], controls: [
      { id: 'lan-info', type: 'info', label: 'LAN TCP/IP Setup', values: [['IP Address', '192.168.1.1'], ['IP Subnet Mask', '255.255.255.0'], ['Use Router as DHCP Server', 'On, 192.168.1.2 to 192.168.1.254']] },
      { id: 'devices', type: 'list', label: 'Attached devices (read only: copy the MAC address from here)', columns: ['Device name', 'IP address', 'MAC address', 'Address type'], rows: [
        { id: 'nvr', cells: ['NVR-SHOP', '192.168.1.50', '00:00:5E:00:53:50', '{{nvr.type}}'] },
        { id: 'pc', cells: ['OFFICE-PC', '192.168.1.23', '00:00:5E:00:53:23', 'DHCP'] },
        { id: 'phone', cells: ['OWNER-PHONE', '192.168.1.31', '00:00:5E:00:53:31', 'DHCP'] },
      ] },
      { id: 'reservations', type: 'info', label: 'Address Reservation', values: [['Reserved for NVR-SHOP (00:00:5E:00:53:50)', '{{resv.nvr}}']] },
      { id: 'resv-add', type: 'link', label: 'Address Reservation: Add', screen: 'resv-add' },
    ] },
    { id: 'resv-add', title: 'Address Reservation', crumbs: ['Advanced', 'Setup', 'LAN Setup', 'Address Reservation'], controls: [
      { id: 'resv-info', type: 'info', text: 'A reserved device always receives the same IP address from the router DHCP server. The reservation takes effect the next time the device contacts the DHCP server.' },
      { id: 'resv-ip', type: 'text', label: 'IP Address', key: 'resv.ip' },
      { id: 'resv-mac', type: 'text', label: 'MAC Address', key: 'resv.mac' },
      { id: 'resv-name', type: 'text', label: 'Device Name', key: 'resv.name' },
      { id: 'resv-apply', type: 'button', label: 'Apply', visibleIf: NVR_RESERVATION_TYPED,
        action: { set: { 'resv.nvr': '192.168.1.50', 'nvr.type': 'Reserved' }, open: 'lan', msg: 'Reserved 192.168.1.50 for 00:00:5E:00:53:50 (NVR-SHOP). The NVR gets this address every time it asks the DHCP server.' } },
      { id: 'resv-apply-blank', type: 'button', label: 'Apply', visibleIf: { any: [{ key: 'resv.ip', op: 'matches', value: '^\\s*$' }, { key: 'resv.mac', op: 'matches', value: '^\\s*$' }] },
        action: { refuse: 'Type the IP Address and the MAC Address first, then select Apply.' } },
      { id: 'resv-apply-nvr-ip', type: 'button', label: 'Apply', visibleIf: { all: [{ key: 'resv.mac', op: 'matches', value: NVR_MAC }, { not: { key: 'resv.ip', op: 'matches', value: '^\\s*(?:192\\.168\\.1\\.50)?\\s*$' } }] },
        action: { refuse: 'That MAC address is the NVR, but this ticket keeps the NVR on the address it has now, 192.168.1.50, so the port forward can point at it. Type 192.168.1.50 as the IP Address.' } },
      { id: 'resv-apply-other', type: 'button', label: 'Apply', visibleIf: { all: [{ not: { key: 'resv.mac', op: 'matches', value: NVR_MAC } }, { not: { key: 'resv.ip', op: 'matches', value: '^\\s*$' } }, { not: { key: 'resv.mac', op: 'matches', value: '^\\s*$' } }] },
        action: { refuse: 'That MAC address is not NVR-SHOP (00:00:5E:00:53:50). No NVR reservation was saved. Use the NVR IP address 192.168.1.50 and its MAC address, then select Apply.' } },
    ] },
    { id: 'forwarding', title: 'Port Forwarding', crumbs: ['Advanced', 'Port Forwarding'], controls: [
      { id: 'pf-info', type: 'info', text: 'A port forwarding rule sends traffic that arrives from the internet on one port to one device on your network.' },
      { id: 'pf-enable', type: 'toggle', label: 'Enable rule', key: 'pf.enabled' },
      { id: 'pf-name', type: 'text', label: 'Service name', key: 'pf.name' },
      { id: 'pf-proto', type: 'select', label: 'Protocol', key: 'pf.proto', options: ['TCP', 'UDP', 'TCP/UDP'] },
      { id: 'pf-ext', type: 'number', label: 'External port', key: 'pf.ext', min: 1, max: 65535 },
      { id: 'pf-ip', type: 'text', label: 'Internal IP address', key: 'pf.ip' },
      { id: 'pf-int', type: 'number', label: 'Internal port', key: 'pf.int', min: 1, max: 65535 },
    ] },
    { id: 'upnp', title: 'UPnP', crumbs: ['Advanced', 'UPnP'], controls: [
      { id: 'upnp-info', type: 'info', text: 'Universal Plug and Play lets devices on your network open ports in the router firewall automatically.' },
      { id: 'upnp', type: 'toggle', label: 'Turn UPnP On', key: 'upnp' },
    ] },
    { id: 'dmz', title: 'DMZ', crumbs: ['Advanced', 'DMZ'], controls: [
      { id: 'dmz-info', type: 'info', text: 'The Default DMZ Server receives all inbound traffic from the internet that no other rule handles.' },
      { id: 'dmz-enable', type: 'toggle', label: 'Default DMZ Server', key: 'dmz.enabled' },
      { id: 'dmz-ip', type: 'text', label: 'DMZ server IP address', key: 'dmz.ip' },
    ] },
    { id: 'administration', title: 'Administration', crumbs: ['Advanced', 'Administration'], controls: [
      { id: 'remote', type: 'select', label: 'Remote management', key: 'admin.remote', options: ['Disabled', 'Enabled'] },
    ] },
  ],
  goals: [
    { id: 'reserve', text: 'Make the NVR keep the same IP address', check: { key: 'resv.nvr', op: 'eq', value: '192.168.1.50' },
      why: 'A port forward points at one internal IP address. If DHCP gives the NVR a different address after a restart, the rule points at nothing, or at some other device. A DHCP reservation ties the address to the NVR MAC address, so it always gets the same one. NETGEAR port forwarding instructions start with this step: the server must always have the same IP address.',
      expect: 'LAN Setup > Address Reservation has 192.168.1.50 reserved for the NVR MAC address 00:00:5E:00:53:50, and NVR-SHOP shows Address type Reserved.',
      hints: ['The NVR address changed once already. Pin it down before you point anything at it.', 'Open LAN Setup, add an address reservation for the address the NVR has now and its MAC address, and apply it.', 'Advanced > Setup > LAN Setup > Address Reservation > Add; enter 192.168.1.50 and 00:00:5E:00:53:50, then Apply.'],
      src: ['ngReserve', 'ngPortForward'] },
    { id: 'forward', text: 'Forward only TCP port 8443 to the NVR', check: { all: [{ key: 'pf.enabled', op: 'eq', value: true }, { key: 'pf.proto', op: 'eq', value: 'TCP' }, { key: 'pf.ext', op: 'eq', value: 8443 }, { key: 'pf.ip', op: 'eq', value: '192.168.1.50' }, { key: 'pf.int', op: 'eq', value: 8443 }] },
      why: 'Port forwarding opens exactly one port, for one protocol, to one device, and the router firewall keeps blocking everything else. Match what the device documentation asks for: TCP 8443 to the NVR. NETGEAR recommends port forwarding over a DMZ because only the needed port is opened.',
      expect: 'Port Forwarding has an enabled rule: Protocol TCP, External port 8443, Internal IP address 192.168.1.50, Internal port 8443.',
      hints: ['Traffic from the internet stops at the router unless a rule sends it to a device.', 'Open Port Forwarding and create one enabled rule for TCP port 8443 to the NVR address.', 'Port Forwarding: Enable rule on, Service name NVR, Protocol TCP, External port 8443, Internal IP address 192.168.1.50, Internal port 8443.'],
      src: ['ngPortForward', 'ngDmz'] },
    { id: 'upnp-off', text: 'Turn off UPnP', check: { key: 'upnp', op: 'eq', value: false },
      why: 'UPnP lets any program on the network open firewall ports without asking you, and CISA notes malware has used it to get past router firewalls. You opened the one port you need by hand, so there is no reason to leave UPnP on.',
      expect: 'UPnP > Turn UPnP On is off.',
      hints: ['One router feature lets devices open firewall ports on their own.', 'Open UPnP and switch it off.', 'UPnP > Turn UPnP On: turn it off.'],
      src: ['cisaHome', 'cisaUpskill', 'ftcWifi'] },
  ],
  traps: [
    { id: 'dmz-on', critical: true, check: { key: 'dmz.enabled', op: 'eq', value: true },
      message: 'Default DMZ Server is on. A DMZ host receives all inbound traffic from the internet, so every port on that device is exposed, not just 8443, and it loses the router firewall protection. NETGEAR warns that a compromised DMZ host can then be used to attack the other computers on the network. Turn Default DMZ Server off and use one port forwarding rule.',
      why: 'Open the narrowest path that works: one port forward, never a DMZ host, for a device that needs one port.',
      src: ['ngDmz'] },
    { id: 'remote-on', check: { key: 'admin.remote', op: 'eq', value: 'Enabled' },
      message: 'Remote management makes the router admin pages reachable from the internet. It does not show the cameras; it only exposes the router login. Set Administration > Remote management back to Disabled.',
      why: 'Remote management is for managing the router, not for reaching devices behind it. Leave it off.',
      src: ['cisaHome', 'ftcWifi'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'lan' }, explain: 'Open Advanced > Setup > LAN Setup to fix the NVR address first. Attached devices shows NVR-SHOP at 192.168.1.50 with MAC address 00:00:5E:00:53:50.' },
    { do: { type: 'act', controlId: 'resv-add' }, explain: 'Address Reservation > Add.' },
    { do: { type: 'set', controlId: 'resv-ip', value: '192.168.1.50' }, explain: 'IP Address: the address the NVR has now.' },
    { do: { type: 'set', controlId: 'resv-mac', value: '00:00:5E:00:53:50' }, explain: 'MAC Address: the NVR hardware address, copied from Attached devices.' },
    { do: { type: 'set', controlId: 'resv-name', value: 'NVR-SHOP' }, explain: 'Device Name, so the next technician knows what the reservation is for.' },
    { do: { type: 'act', controlId: 'resv-apply' }, explain: 'Apply. 192.168.1.50 is now reserved for the NVR, so the forward always points at it.' },
    { do: { type: 'open', screenId: 'forwarding' }, explain: 'Open Port Forwarding.' },
    { do: { type: 'set', controlId: 'pf-name', value: 'NVR' }, explain: 'Name the rule so the next technician knows what it is for.' },
    { do: { type: 'set', controlId: 'pf-proto', value: 'TCP' }, explain: 'The NVR manual says TCP, so forward TCP only.' },
    { do: { type: 'set', controlId: 'pf-ext', value: 8443 }, explain: 'External port 8443: the port the phone app connects to.' },
    { do: { type: 'set', controlId: 'pf-ip', value: '192.168.1.50' }, explain: 'Send it to the NVR reserved address.' },
    { do: { type: 'set', controlId: 'pf-int', value: 8443 }, explain: 'Internal port 8443: the port the NVR listens on.' },
    { do: { type: 'set', controlId: 'pf-enable', value: true }, explain: 'Enable the rule. Only TCP 8443 reaches the NVR; everything else stays blocked.' },
    { do: { type: 'open', screenId: 'upnp' }, explain: 'Open UPnP.' },
    { do: { type: 'set', controlId: 'upnp', value: false }, explain: 'Turn UPnP off so no program can open more ports without you.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'dmz' } },
    { do: { type: 'set', controlId: 'dmz-ip', value: '192.168.1.50' } },
    { do: { type: 'set', controlId: 'dmz-enable', value: true } },
    { do: { type: 'open', screenId: 'administration' } },
    { do: { type: 'set', controlId: 'remote', value: 'Enabled' } },
  ],
  src: ['ngReserve', 'ngPortForward', 'ngDmz', 'cisaHome', 'cisaUpskill'],
};

const PHARMACY_DEFAULT_SSID = 'RTR-AX3000-3F2A';

const router04 = {
  id: 'router-04', title: 'Harden a router the safe way', level: 2, minutes: 8,
  scenario: 'Cedar Lane Pharmacy got an email from router-support@updates-help.example saying its router firmware is out of date, with a link to an urgent patch; the office manager downloaded that file but did not install it, and nobody has verified it. The router runs firmware 3.0.4, and in this simulated router the trusted update service reports version 3.2.1. Update it safely, turn off remote management (nobody uses it) and replace the factory network name. WPS is off and must stay off.',
  examObjs: { 'aplus-1202': ['2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'fw.version': '3.0.4', 'fw.source': 'factory', 'fw.available': '', 'admin.remote': 'Enabled',
    'wifi.ssid': PHARMACY_DEFAULT_SSID, 'wifi.broadcast': true, 'wifi.security': 'WPA3 Personal', 'wifi.password': 'Saffron-Mortar-Quill-Harbor-63',
    wps: 'Disabled',
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['Firmware version', '{{fw.version}}'], ['Network name (SSID)', '{{wifi.ssid}}'], ['Wireless security', '{{wifi.security}}'], ['WPS', '{{wps}}'], ['Remote management', '{{admin.remote}}']] },
    ] },
    { id: 'firmware', title: 'Firmware Update', crumbs: ['Advanced', 'Administration', 'Firmware Update'], controls: [
      { id: 'fw-info', type: 'info', text: 'Current firmware version: {{fw.version}}. Do not turn off the router while an update installs.' },
      { id: 'check', type: 'button', label: 'Check', visibleIf: { key: 'fw.version', op: 'ne', value: '3.2.1' },
        action: { set: { 'fw.available': '3.2.1' }, msg: 'Firmware 3.2.1 is available. Select Upgrade to install it.' } },
      { id: 'check-current', type: 'button', label: 'Check', visibleIf: { key: 'fw.version', op: 'eq', value: '3.2.1' },
        action: { msg: 'No new firmware version available. The router firmware is up to date.' } },
      { id: 'upgrade', type: 'button', label: 'Upgrade', visibleIf: { all: [{ key: 'fw.available', op: 'eq', value: '3.2.1' }, { key: 'fw.version', op: 'ne', value: '3.2.1' }] },
        action: { set: { 'fw.version': '3.2.1', 'fw.source': 'vendor' }, msg: 'Firmware 3.2.1 from the manufacturer update service installed. The router restarted.' } },
      { id: 'files', type: 'list', label: 'Manual update: upload a file from this computer Downloads folder', columns: ['File', 'Where it came from'], rows: [
        { id: 'vendor-file', cells: ['RTR-AX3000_V3.2.1.img', 'Downloaded by you from the manufacturer support site for this simulated model'], actions: [
          { id: 'upload', label: 'Upload', action: { set: { 'fw.version': '3.2.1', 'fw.source': 'vendor' }, msg: 'Firmware 3.2.1 uploaded and installed. The router restarted.' } },
        ] },
        { id: 'email-file', cells: ['Router_Security_Patch_URGENT.img', 'Downloaded from the link in the email from router-support@updates-help.example'], actions: [
          { id: 'upload', label: 'Upload', action: { set: { 'fw.version': '3.2.1 (unverified build)', 'fw.source': 'email' }, msg: 'Firmware uploaded and installed. The router restarted with firmware from an unknown source.' } },
        ] },
      ] },
    ] },
    { id: 'wireless', title: 'Wireless', crumbs: ['Wireless'], controls: [
      { id: 'ssid', type: 'text', label: 'Network name (SSID)', key: 'wifi.ssid' },
      { id: 'broadcast', type: 'toggle', label: 'Enable SSID Broadcast', key: 'wifi.broadcast' },
      { id: 'security', type: 'select', label: 'Security', key: 'wifi.security', options: SECURITY_MODES },
      { id: 'wifi-password', type: 'password', label: 'Wi-Fi password', key: 'wifi.password', disabledIf: { key: 'wifi.security', op: 'eq', value: 'None' } },
    ] },
    { id: 'wps', title: 'WPS', crumbs: ['Wireless', 'WPS'], controls: [
      { id: 'wps', type: 'select', label: 'WPS (Wi-Fi Protected Setup)', key: 'wps', options: ['Enabled', 'Disabled'] },
    ] },
    { id: 'administration', title: 'Administration', crumbs: ['Advanced', 'Administration'], controls: [
      { id: 'login', type: 'info', text: 'Router login user name: admin (password changed at install)' },
      { id: 'remote', type: 'select', label: 'Remote management', key: 'admin.remote', options: ['Disabled', 'Enabled'] },
    ] },
  ],
  goals: [
    { id: 'firmware', text: 'Update the firmware from the manufacturer', check: { all: [{ key: 'fw.version', op: 'eq', value: '3.2.1' }, { key: 'fw.source', op: 'eq', value: 'vendor' }] },
      why: 'Firmware updates fix flaws and security vulnerabilities, so an out-of-date router needs one. Get it only from the manufacturer: the router update check, or a file you download yourself from the manufacturer support site for this model. A link in an unexpected email is not the manufacturer; the FTC says to use a website you know is real instead of the information in the email.',
      expect: 'Status shows firmware 3.2.1, installed with Check and then Upgrade, or from RTR-AX3000_V3.2.1.img (the support-site file).',
      hints: ['The router needs an update, but where the file comes from matters as much as the update.', 'Open Firmware Update and update from the manufacturer: Check, then install what it finds, or upload the file that came from the support site.', 'Firmware Update > Check > Upgrade.'],
      src: ['cisaHome', 'ngFirmware', 'ngFwCheck', 'ftcPhishing', 'ftcWifi'] },
    { id: 'remote-off', text: 'Turn off remote management', check: { key: 'admin.remote', op: 'eq', value: 'Disabled' },
      why: 'Remote management lets anyone on the internet reach the router login page. CISA and the FTC both say to turn it off. Nobody here uses it, so it is only a way in for attackers.',
      expect: 'Administration > Remote management is Disabled.',
      hints: ['One setting makes the router login reachable from the internet.', 'Open Administration and change Remote management.', 'Administration > Remote management > Disabled.'],
      src: ['cisaHome', 'ftcWifi', 'cisaUpskill'] },
    { id: 'ssid', text: 'Replace the factory network name', check: { all: [{ key: 'wifi.ssid', op: 'ne', value: PHARMACY_DEFAULT_SSID }, { key: 'wifi.ssid', op: 'matches', value: '^(?![\\s\\S]*(?:[Rr][Tt][Rr]-|[Cc][Ee][Dd][Aa][Rr]|[Pp][Hh][Aa][Rr][Mm]))\\S.{0,31}$' }] },
      why: 'A default network name usually identifies the manufacturer or the device, which tells an attacker which default settings and known flaws to try. CISA says to change it to a unique name that is not tied to your identity or location, so leave out the pharmacy name too. Devices reconnect once to the new name with the same password. Turning off Enable SSID Broadcast is a real setting (the A+ Core 2 objectives list it under 2.10), but it is not a security control: Microsoft notes a hidden network is still detectable because its name travels in device probe requests and router replies. It does not replace WPA3 and a strong passphrase, which this router already has, and Microsoft and Apple recommend leaving the name broadcast.',
      expect: 'Wireless > Network name (SSID) is a new unique name that shows neither the router model nor the business, for example Lantern-Net.',
      hints: ['The network name still shows the router model it came with.', 'Open Wireless and change the Network name (SSID) to something unique that does not name the router or the business.', 'Wireless > Network name (SSID): type Lantern-Net (or any unique name without the model or the pharmacy name).'],
      src: ['cisaHome', 'cisaWireless', 'cisaUpskill', 'ftcWifi', 'msNonBroadcast', 'appleRouter', 'comptiaA2obj'] },
    { id: 'preserve-wpa3', text: 'Keep the existing WPA3 security mode',
      check: { key: 'wifi.security', op: 'eq', value: 'WPA3 Personal' },
      why: 'This router already uses WPA3 Personal. No device compatibility issue calls for a downgrade during hardening.',
      expect: 'Wireless > Security remains WPA3 Personal.',
      hints: ['Check the existing wireless security.', 'Leave the current WPA3 Personal setting in place.', 'Wireless > Security > WPA3 Personal.'],
      src: ['appleRouter'] },
  ],
  traps: [
    { id: 'email-firmware', critical: true, check: { key: 'fw.source', op: 'eq', value: 'email' },
      message: 'You installed firmware from a link in an unexpected email, not from the manufacturer. Nobody can say what that file contains, and the router sits between every device and the internet. Never act on the link in such an email; go to the manufacturer support site you know is real. In real life, stop and treat that router as untrusted until it is reloaded with firmware from the manufacturer. Here, update again with Check and Upgrade, or the support-site file.',
      why: 'Firmware comes from the manufacturer only: the router update check or the support site for your model.',
      src: ['ftcPhishing', 'cisaHome', 'ngFirmware'] },
    { id: 'wps-on', critical: true, check: { key: 'wps', op: 'eq', value: 'Enabled' },
      message: 'WPS is now Enabled. It lets a device join with a button press or a PIN instead of the Wi-Fi password, and a design flaw in WPS PIN authentication lets attackers recover the PIN. Set Wireless > WPS back to Disabled.',
      why: 'Disable WPS when it is not needed. The WPS PIN method has a known authentication weakness, and WPS provides another enrollment path to manage.',
      src: ['cisaHome', 'ftcWifi', 'cisaUpskill'] },
    { id: 'weak-security', critical: true, check: { key: 'wifi.security', op: 'in', value: WEAK_MODES },
      message: 'The Wi-Fi network is now open or using WEP or TKIP. None lets anyone in range join, and WEP and TKIP are weak legacy settings. Nothing in this ticket needed a security change: set Wireless > Security back to WPA3 Personal.',
      why: 'Hardening never steps Wi-Fi security down; None, WEP and TKIP are never acceptable.',
      src: ['appleRouter', 'ftcWifi'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'firmware' }, explain: 'Open Firmware Update. Ignore the file from the email.' },
    { do: { type: 'act', controlId: 'check' }, explain: 'Check asks the manufacturer update service, which reports 3.2.1. Checking alone installs nothing.' },
    { do: { type: 'act', controlId: 'upgrade' }, explain: 'Upgrade installs 3.2.1 from the manufacturer and restarts the router (uploading the support-site file works too). Do not turn the router off while it installs.' },
    { do: { type: 'open', screenId: 'administration' }, explain: 'Open Administration.' },
    { do: { type: 'set', controlId: 'remote', value: 'Disabled' }, explain: 'Turn off remote management; nobody needs the router login from the internet.' },
    { do: { type: 'open', screenId: 'wireless' }, explain: 'Open Wireless.' },
    { do: { type: 'set', controlId: 'ssid', value: 'Lantern-Net' }, explain: 'Replace the factory name with a unique one that names neither the router model nor the pharmacy. WPS stays Disabled.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'firmware' } },
    { do: { type: 'act', controlId: 'files', rowId: 'email-file', actionId: 'upload' } },
    { do: { type: 'open', screenId: 'wps' } },
    { do: { type: 'set', controlId: 'wps', value: 'Enabled' } },
    { do: { type: 'open', screenId: 'wireless' } },
    { do: { type: 'set', controlId: 'security', value: 'None' } },
  ],
  src: ['cisaHome', 'ftcWifi', 'ftcPhishing', 'ngFirmware', 'cisaUpskill', 'appleRouter', 'msNonBroadcast'],
};

const TIME_ZONES = ['(GMT-10:00) Hawaii', '(GMT-09:00) Alaska', '(GMT-08:00) Pacific Time (US and Canada)', '(GMT-07:00) Mountain Time (US and Canada)', '(GMT-06:00) Central Time (US and Canada)', '(GMT-05:00) Eastern Time (US and Canada)', '(GMT) Coordinated Universal Time'];
const PACIFIC = '(GMT-08:00) Pacific Time (US and Canada)';
const DNS_MANUAL = 'Use these DNS servers';
const WEEKDAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];

const GAMES_ENTRY = '^\\s*(?:[Ww][Ww][Ww]\\.)?[Gg][Aa][Mm][Ee][Ss]\\.[Ee][Xx][Aa][Mm][Pp][Ll][Ee]\\s*$';
const SCHEDULE_COVERS_16 = [
  { key: 'sched.start', op: 'in', value: HOURS.slice(0, 17) }, { key: 'sched.end', op: 'in', value: HOURS.slice(17) },
  { key: 'time.zone', op: 'eq', value: PACIFIC },
];
// Would the simulated Domain Filter refuse https://games.example at 16:00 center time on this day?
const filterBlocksAt = (day) => ({ all: [{ key: 'filter.list', op: 'eq', value: 'games.example' }, { any: [
  { key: 'filter.mode', op: 'eq', value: 'Always' },
  { all: [{ key: 'filter.mode', op: 'eq', value: 'Per Schedule' }, { key: `sched.${day}`, op: 'eq', value: true }, ...SCHEDULE_COVERS_16] },
] }] });
const FAMILIES_DNS = { all: [{ key: 'dns.mode', op: 'eq', value: DNS_MANUAL }, { any: [
  { all: [{ key: 'dns.primary', op: 'eq', value: '1.1.1.3' }, { key: 'dns.secondary', op: 'eq', value: '1.0.0.3' }] },
  { all: [{ key: 'dns.primary', op: 'eq', value: '1.0.0.3' }, { key: 'dns.secondary', op: 'eq', value: '1.1.1.3' }] },
] }] };

const router05 = {
  id: 'router-05', title: 'Content filtering on a schedule', level: 3, minutes: 12,
  scenario: 'Brightpath Tutoring, a small learning center, runs its student laptops and staff PCs on one router. Parents asked for two rules: block adult content and known malware sites on devices that use the router for DNS, and block the game site games.example during weekday tutoring sessions, 15:00 to 19:00. The center hosts a game club on Saturdays that uses games.example, so the block must not apply then. The center is in the US Pacific time zone, and games.example is an HTTPS site; before closing the ticket, test https://games.example for a weekday session and for Saturday.',
  examObjs: { 'aplus-1202': ['2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'dns.mode': 'Get automatically from ISP', 'dns.primary': '', 'dns.secondary': '',
    'block.mode': 'Never', 'block.entry': '', 'block.list': '',
    'filter.mode': 'Never', 'filter.entry': '', 'filter.list': '',
    'test.weekday': 'Not run', 'test.saturday': 'Not run',
    'sched.mon': false, 'sched.tue': false, 'sched.wed': false, 'sched.thu': false, 'sched.fri': false, 'sched.sat': false, 'sched.sun': false,
    'sched.start': '00:00', 'sched.end': '00:00',
    'time.zone': '(GMT) Coordinated Universal Time', 'time.dst': false,
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['DNS', '{{dns.mode}}'], ['Keyword blocking', '{{block.mode}}'], ['Domain Filter', '{{filter.mode}}'], ['Time zone', '{{time.zone}}']] },
    ] },
    { id: 'internet', title: 'Internet Setup', crumbs: ['Internet Setup'], controls: [
      { id: 'dns-mode', type: 'select', label: 'Domain Name Server (DNS) Address', key: 'dns.mode', options: ['Get automatically from ISP', DNS_MANUAL] },
      { id: 'dns-primary', type: 'text', label: 'Primary DNS', key: 'dns.primary', visibleIf: { key: 'dns.mode', op: 'eq', value: DNS_MANUAL } },
      { id: 'dns-secondary', type: 'text', label: 'Secondary DNS', key: 'dns.secondary', visibleIf: { key: 'dns.mode', op: 'eq', value: DNS_MANUAL } },
      { id: 'dns-note', type: 'info', label: 'DNS services listed in the provider documentation (Cloudflare)', values: [['1.1.1.1 and 1.0.0.1', 'Standard resolver'], ['1.1.1.2 and 1.0.0.2', '1.1.1.1 for Families: blocks malware'], ['1.1.1.3 and 1.0.0.3', '1.1.1.1 for Families: blocks malware and adult content']] },
    ] },
    { id: 'block', title: 'Block Sites', crumbs: ['Advanced', 'Security', 'Block Sites'], controls: [
      { id: 'block-mode', type: 'select', label: 'Keyword Blocking', key: 'block.mode', options: ['Never', 'Per Schedule', 'Always'] },
      { id: 'block-entry', type: 'text', label: 'Type keyword or domain name here', key: 'block.entry' },
      { id: 'add-keyword', type: 'button', label: 'Add Keyword', visibleIf: { key: 'block.entry', op: 'matches', value: GAMES_ENTRY },
        action: { set: { 'block.list': 'games.example' }, msg: 'games.example added to the keyword list.' } },
      { id: 'add-keyword-other', type: 'button', label: 'Add Keyword', visibleIf: { not: { key: 'block.entry', op: 'matches', value: GAMES_ENTRY } },
        action: { msg: 'This simulated list only takes the domain in the ticket. Type games.example.' } },
      { id: 'keyword-list', type: 'list', label: 'Keyword list', columns: ['Keyword or domain'], rows: [
        { id: 'games', cells: ['games.example'], visibleIf: { key: 'block.list', op: 'eq', value: 'games.example' }, actions: [
          { id: 'delete', label: 'Delete Keyword', action: { set: { 'block.list': '' }, msg: 'games.example removed from the keyword list.' } },
        ] },
      ] },
      { id: 'block-apply', type: 'button', label: 'Apply', action: { msg: 'Block Sites settings saved.' } },
    ] },
    { id: 'filter', title: 'Domain Filter', crumbs: ['Advanced', 'Security', 'Domain Filter'], controls: [
      { id: 'filter-info', type: 'info', text: 'Domain Filter (a feature of this simulated router) refuses DNS lookups for the listed domains, so a listed site is blocked whether its address starts with http:// or https://. It covers devices that use the router for DNS. Per Schedule uses the Schedule page.' },
      { id: 'filter-mode', type: 'select', label: 'Domain blocking', key: 'filter.mode', options: ['Never', 'Per Schedule', 'Always'] },
      { id: 'filter-entry', type: 'text', label: 'Domain name', key: 'filter.entry' },
      { id: 'add-domain', type: 'button', label: 'Add domain', visibleIf: { key: 'filter.entry', op: 'matches', value: GAMES_ENTRY },
        action: { set: { 'filter.list': 'games.example' }, msg: 'games.example added to the Domain Filter list.' } },
      { id: 'add-domain-other', type: 'button', label: 'Add domain', visibleIf: { not: { key: 'filter.entry', op: 'matches', value: GAMES_ENTRY } },
        action: { msg: 'This simulated list only takes the domain in the ticket. Type games.example.' } },
      { id: 'domain-list', type: 'list', label: 'Blocked domains', columns: ['Domain'], rows: [
        { id: 'games', cells: ['games.example'], visibleIf: { key: 'filter.list', op: 'eq', value: 'games.example' }, actions: [
          { id: 'delete', label: 'Delete domain', action: { set: { 'filter.list': '' }, msg: 'games.example removed from the Domain Filter list.' } },
        ] },
      ] },
      { id: 'test-results', type: 'info', label: 'HTTPS test results for https://games.example (center time)', values: [['Monday 16:00', '{{test.weekday}}'], ['Saturday 16:00', '{{test.saturday}}']] },
      { id: 'test-weekday', type: 'button', label: 'Test https://games.example on Monday at 16:00', visibleIf: filterBlocksAt('mon'),
        action: { set: { 'test.weekday': 'Blocked' }, msg: 'Test result: https://games.example is blocked on Monday at 16:00. The DNS lookup was refused, so the HTTPS page never loaded.' } },
      { id: 'test-weekday-open', type: 'button', label: 'Test https://games.example on Monday at 16:00', visibleIf: { not: filterBlocksAt('mon') },
        action: { set: { 'test.weekday': 'Not blocked' }, msg: 'Test result: https://games.example loaded on Monday at 16:00. Nothing is blocking it during tutoring hours yet.' } },
      { id: 'test-saturday', type: 'button', label: 'Test https://games.example on Saturday at 16:00', visibleIf: { not: filterBlocksAt('sat') },
        action: { set: { 'test.saturday': 'Not blocked' }, msg: 'Test result: https://games.example loaded on Saturday at 16:00, so the game club can use it.' } },
      { id: 'test-saturday-blocked', type: 'button', label: 'Test https://games.example on Saturday at 16:00', visibleIf: filterBlocksAt('sat'),
        action: { set: { 'test.saturday': 'Blocked' }, msg: 'Test result: https://games.example is blocked on Saturday at 16:00, so the game club cannot use it.' } },
    ] },
    { id: 'schedule', title: 'Schedule', crumbs: ['Advanced', 'Security', 'Schedule'], controls: [
      { id: 'sched-info', type: 'info', text: 'Per Schedule blocking is active only on the days and hours below. Times use the 24-hour clock and the router time zone.' },
      ...WEEKDAYS.map(([key, label]) => ({ id: `day-${key}`, type: 'toggle', label, key: `sched.${key}` })),
      { id: 'sched-start', type: 'select', label: 'Start blocking', key: 'sched.start', options: HOURS },
      { id: 'sched-end', type: 'select', label: 'End blocking', key: 'sched.end', options: HOURS },
      { id: 'tz', type: 'select', label: 'Time zone', key: 'time.zone', options: TIME_ZONES },
      { id: 'dst', type: 'toggle', label: 'Automatically adjust for daylight saving time', key: 'time.dst' },
    ] },
  ],
  goals: [
    { id: 'dns-filter', text: 'Filter malware and adult content with DNS', check: FAMILIES_DNS,
      why: 'These Cloudflare Families resolvers filter malware and adult-domain lookups made through the router. Devices using another DNS resolver, browser secure DNS, or separately configured IPv6 DNS can bypass this router setting. For a policy that must cover every managed device, also control client DNS and verify both IPv4 and IPv6 behavior. Pick the service that matches the policy: 1.1.1.2 and 1.0.0.2 block malware; 1.1.1.3 and 1.0.0.3 block malware and adult content. Enter both addresses of the same service, in either order, so the backup server filters too.',
      expect: 'Internet Setup > Domain Name Server (DNS) Address is Use these DNS servers, with 1.1.1.3 and 1.0.0.3 as Primary and Secondary DNS (either order).',
      hints: ['Devices that use the router for DNS look up site names through it, so filtering there covers all of them at once.', 'Open Internet Setup, choose your own DNS servers, and use the pair that blocks both malware and adult content.', 'Internet Setup > Domain Name Server (DNS) Address > Use these DNS servers; Primary DNS 1.1.1.3; Secondary DNS 1.0.0.3.'],
      src: ['cfFamilies', 'cfIps', 'cfRouter', 'cfDohBrowsers', 'ngDns'] },
    { id: 'block-site', text: 'Block games.example during tutoring hours with a policy that covers HTTPS', check: { all: [
      { key: 'filter.mode', op: 'eq', value: 'Per Schedule' }, { key: 'filter.list', op: 'eq', value: 'games.example' },
      { key: 'test.weekday', op: 'eq', value: 'Blocked' }, { key: 'test.saturday', op: 'eq', value: 'Not blocked' },
    ] },
      why: 'This router\'s Keyword Blocking feature does not block HTTPS websites. It cannot enforce the requested game-site rule. Use a filtering product with documented scheduled domain policies, then test HTTPS access during tutoring hours and on Saturday. Here that is the Domain Filter: it refuses the DNS lookup, which stops HTTPS as well as HTTP, and Per Schedule applies it only during the Schedule days and hours.',
      expect: 'Domain Filter: Domain blocking is Per Schedule, games.example is in the list, and the HTTPS tests show Monday 16:00 Blocked and Saturday 16:00 Not blocked (run them after the Schedule is set).',
      hints: ['games.example uses HTTPS, and Block Sites keyword blocking only works for http:// addresses.', 'Use the Domain Filter page: add games.example, pick the mode that follows the schedule, then run both HTTPS tests once the schedule is right.', 'Advanced > Security > Domain Filter > Domain name: games.example > Add domain; Domain blocking: Per Schedule; after the Schedule is set, Test on Monday at 16:00 and Test on Saturday at 16:00.'],
      src: ['ngManual', 'cfDnsPolicies', 'ngSchedule'] },
    { id: 'schedule', text: 'Set the schedule to weekdays 15:00 to 19:00', check: { all: [
      ...['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => ({ key: `sched.${day}`, op: 'eq', value: true })),
      { key: 'sched.sat', op: 'eq', value: false }, { key: 'sched.sun', op: 'eq', value: false },
      { key: 'sched.start', op: 'eq', value: '15:00' }, { key: 'sched.end', op: 'eq', value: '19:00' },
    ] },
      why: 'The schedule decides when Per Schedule blocking is active, and the router uses one schedule for its blocking features. Select only the days and hours the rule is for: Monday to Friday, 15:00 to 19:00 in 24-hour time, and leave Saturday off for the game club.',
      expect: 'Schedule: Monday to Friday on, Saturday and Sunday off, Start blocking 15:00, End blocking 19:00.',
      hints: ['Per Schedule does nothing useful until the schedule says when.', 'Open Schedule, select the five weekdays only, and set the tutoring hours in 24-hour time.', 'Schedule: Monday, Tuesday, Wednesday, Thursday, Friday on; Saturday and Sunday off; Start blocking 15:00; End blocking 19:00.'],
      src: ['ngSchedule'] },
    { id: 'time-zone', text: 'Run the schedule on local time', check: { all: [{ key: 'time.zone', op: 'eq', value: PACIFIC }, { key: 'time.dst', op: 'eq', value: true }] },
      why: 'The router runs the schedule on its own clock. Set to Coordinated Universal Time, a 15:00 block starts at 15:00 UTC, which is the morning in Pacific time. Set the local time zone and the daylight saving adjustment so 15:00 means 15:00 at the center all year.',
      expect: 'Schedule: Time zone (GMT-08:00) Pacific Time (US and Canada), Automatically adjust for daylight saving time on.',
      hints: ['A schedule is only as right as the router clock.', 'On the Schedule page, set the center time zone and turn on the daylight saving adjustment.', 'Schedule > Time zone > (GMT-08:00) Pacific Time (US and Canada); Automatically adjust for daylight saving time: on.'],
      src: ['ngSchedule'] },
  ],
  traps: [
    { id: 'keyword-https', check: { all: [{ key: 'block.mode', op: 'in', value: ['Per Schedule', 'Always'] }, { key: 'block.list', op: 'eq', value: 'games.example' },
      { not: { all: [{ key: 'filter.mode', op: 'eq', value: 'Per Schedule' }, { key: 'filter.list', op: 'eq', value: 'games.example' }] } }] },
      message: 'You relied on Block Sites keyword blocking for games.example. On this router, keyword blocking works only for addresses that begin with http://; it does not block https:// addresses, and games.example, like almost every site today, uses HTTPS. Students could still open it during tutoring. Use the Domain Filter, which blocks at the DNS lookup, and test https://games.example.',
      why: 'Know what a filter can see: a keyword rule that only reads http:// addresses cannot block an HTTPS site. Test the real https:// address before calling a block done.',
      src: ['ngManual', 'ngBlockSites', 'cfDnsPolicies'] },
    { id: 'block-always', check: { any: [{ key: 'filter.mode', op: 'eq', value: 'Always' }, { all: [{ key: 'block.mode', op: 'eq', value: 'Always' }, { key: 'block.list', op: 'eq', value: 'games.example' }] }] },
      message: 'An active blocking rule is set to Always, so it runs all week and ignores the schedule, including the Saturday game club. Set Domain Filter > Domain blocking to Per Schedule. If Block Sites has a keyword in its list, also set Keyword Blocking to Per Schedule or remove the keyword.',
      why: 'A time-based rule needs Per Schedule plus a schedule; Always means always when the blocking list contains the site.',
      src: ['ngBlockSites', 'ngSchedule'] },
    { id: 'unfiltered-dns', check: { all: [{ key: 'dns.mode', op: 'eq', value: DNS_MANUAL }, { any: [{ key: 'dns.primary', op: 'in', value: ['1.1.1.1', '1.0.0.1'] }, { key: 'dns.secondary', op: 'in', value: ['1.1.1.1', '1.0.0.1'] }] }] },
      message: '1.1.1.1 and 1.0.0.1 are the standard resolver, not one of the 1.1.1.1 for Families filtering addresses. Lookups answered by that server are not filtered, which leaves a hole in the adult content and malware block. Use 1.1.1.3 and 1.0.0.3 as the Primary and Secondary DNS.',
      why: 'Every DNS server the router uses must be part of the same filtering service.',
      src: ['cfFamilies', 'cfIps'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'internet' }, explain: 'Open Internet Setup to change where the router looks up names.' },
    { do: { type: 'set', controlId: 'dns-mode', value: DNS_MANUAL }, explain: 'Stop using the ISP DNS servers and enter your own.' },
    { do: { type: 'set', controlId: 'dns-primary', value: '1.1.1.3' }, explain: '1.1.1.3 is 1.1.1.1 for Families with malware and adult content blocking.' },
    { do: { type: 'set', controlId: 'dns-secondary', value: '1.0.0.3' }, explain: 'Its partner address, so the backup server filters too. Devices with their own DNS or browser secure DNS would still need separate controls.' },
    { do: { type: 'open', screenId: 'schedule' }, explain: 'Set the schedule first, so the HTTPS tests at the end mean something.' },
    { do: { type: 'set', controlId: 'tz', value: PACIFIC }, explain: 'Put the router clock on the center time zone.' },
    { do: { type: 'set', controlId: 'dst', value: true }, explain: 'Follow daylight saving time so the hours stay right all year.' },
    { do: { type: 'set', controlId: 'day-mon', value: true }, explain: 'Select Monday.' },
    { do: { type: 'set', controlId: 'day-tue', value: true }, explain: 'Select Tuesday.' },
    { do: { type: 'set', controlId: 'day-wed', value: true }, explain: 'Select Wednesday.' },
    { do: { type: 'set', controlId: 'day-thu', value: true }, explain: 'Select Thursday.' },
    { do: { type: 'set', controlId: 'day-fri', value: true }, explain: 'Select Friday. Saturday and Sunday stay off.' },
    { do: { type: 'set', controlId: 'sched-start', value: '15:00' }, explain: 'Blocking starts when tutoring starts, 15:00.' },
    { do: { type: 'set', controlId: 'sched-end', value: '19:00' }, explain: 'Blocking ends at 19:00.' },
    { do: { type: 'open', screenId: 'filter' }, explain: 'Open Domain Filter, not Block Sites: keyword blocking here does not block https:// addresses.' },
    { do: { type: 'set', controlId: 'filter-entry', value: 'games.example' }, explain: 'Type the domain from the ticket.' },
    { do: { type: 'act', controlId: 'add-domain' }, explain: 'Add it to the blocked domains.' },
    { do: { type: 'set', controlId: 'filter-mode', value: 'Per Schedule' }, explain: 'Per Schedule, not Always, so the Saturday game club still works.' },
    { do: { type: 'act', controlId: 'test-weekday' }, explain: 'Test the HTTPS address during tutoring hours: blocked.' },
    { do: { type: 'act', controlId: 'test-saturday' }, explain: 'Test it on Saturday: not blocked, so the game club works. Both results match the parents\' rules.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'block' } },
    { do: { type: 'set', controlId: 'block-entry', value: 'games.example' } },
    { do: { type: 'act', controlId: 'add-keyword' } },
    { do: { type: 'set', controlId: 'block-mode', value: 'Per Schedule' } },
    { do: { type: 'act', controlId: 'block-apply' } },
    { do: { type: 'open', screenId: 'filter' } },
    { do: { type: 'set', controlId: 'filter-mode', value: 'Always' } },
    { do: { type: 'open', screenId: 'internet' } },
    { do: { type: 'set', controlId: 'dns-mode', value: DNS_MANUAL } },
    { do: { type: 'set', controlId: 'dns-primary', value: '1.1.1.1' } },
  ],
  src: ['cfFamilies', 'cfIps', 'cfRouter', 'cfDohBrowsers', 'cfDnsPolicies', 'ngDns', 'ngManual', 'ngBlockSites', 'ngSchedule'],
};

const STUDIO_STAFF_PASSWORD = 'Graphite-Meadow-Fold-Ink-58';
const STUDIO_NAMES = ['Larkspur'];
const STUDIO_SSIDS = ['wifi.ssid', 'iot.ssid'];
const STUDIO_WIFI_EXTRA = [...noNames('wifi.password', STUDIO_NAMES, STUDIO_SSIDS), notNear('wifi.password', 'iot.password')];
const STUDIO_IOT_EXTRA = [...noNames('iot.password', STUDIO_NAMES, STUDIO_SSIDS), notNear('iot.password', 'wifi.password')];

const router06 = {
  id: 'router-06', title: 'Small office: WPA3, an IoT network and a DHCP pool', level: 3, minutes: 12,
  scenario: 'Larkspur Design Studio replaced its router and copied the old settings. All 12 staff laptops and phones support WPA3. A smart thermostat and a door intercom support only WPA2 Personal and need nothing but the internet. The printer (192.168.10.10) and the NAS (192.168.10.11) use static addresses, and the owner wants 192.168.10.2 to .49 kept for static devices, with at least 100 addresses left in the DHCP pool.',
  examObjs: { 'aplus-1201': ['2.6'], 'aplus-1202': ['2.3', '2.10'] }, objs: [],
  skin: 'router',
  home: 'status',
  state: {
    'wifi.ssid': 'LDS-Staff', 'wifi.security': 'WPA2 Personal (AES)', 'wifi.password': STUDIO_STAFF_PASSWORD,
    'iot.enabled': false, 'iot.ssid': 'LDS-Devices', 'iot.lan': true, 'iot.security': 'None', 'iot.password': '',
    'dhcp.on': true, 'dhcp.start': 2, 'dhcp.end': 254,
    'mac.filter': false,
  },
  screens: [
    { id: 'status', title: 'Status', crumbs: ['Status'], controls: [
      { id: 'summary', type: 'info', label: 'Router status', values: [['Internet', 'Connected'], ['Router LAN IP address', '192.168.10.1'], ['Subnet mask', '255.255.255.0'], ['Staff network', '{{wifi.ssid}} ({{wifi.security}})'], ['IoT network', '{{iot.ssid}} ({{iot.security}})'], ['DHCP pool', '192.168.10.{{dhcp.start}} to 192.168.10.{{dhcp.end}}']] },
    ] },
    { id: 'wireless', title: 'Wireless', crumbs: ['Wireless'], controls: [
      { id: 'ssid', type: 'text', label: 'Network name (SSID)', key: 'wifi.ssid' },
      { id: 'security', type: 'select', label: 'Security', key: 'wifi.security', options: SECURITY_MODES },
      { id: 'wifi-password', type: 'password', label: 'Wi-Fi password', key: 'wifi.password', disabledIf: { key: 'wifi.security', op: 'eq', value: 'None' } },
    ] },
    { id: 'iot', title: 'IoT Network', crumbs: ['Wireless', 'IoT Network'], controls: [
      { id: 'iot-enable', type: 'toggle', label: 'Enable IoT network', key: 'iot.enabled' },
      { id: 'iot-ssid', type: 'text', label: 'IoT network name (SSID)', key: 'iot.ssid' },
      { id: 'iot-lan', type: 'toggle', label: 'Allow devices on this network to access the main network', key: 'iot.lan' },
      { id: 'iot-security', type: 'select', label: 'Security', key: 'iot.security', options: SECURITY_MODES },
      { id: 'iot-password', type: 'password', label: 'IoT Wi-Fi password', key: 'iot.password', disabledIf: { key: 'iot.security', op: 'eq', value: 'None' } },
    ] },
    { id: 'lan', title: 'LAN Setup', crumbs: ['Advanced', 'Setup', 'LAN Setup'], controls: [
      { id: 'lan-info', type: 'info', label: 'LAN', values: [['IP address', '192.168.10.1'], ['Subnet mask', '255.255.255.0'], ['Static devices', 'PRINTER 192.168.10.10, NAS 192.168.10.11']] },
      { id: 'dhcp', type: 'toggle', label: 'Use Router as DHCP Server', key: 'dhcp.on' },
      { id: 'dhcp-start', type: 'number', label: 'Starting IP Address (192.168.10.x)', key: 'dhcp.start', min: 2, max: 254, disabledIf: { key: 'dhcp.on', op: 'eq', value: false } },
      { id: 'dhcp-end', type: 'number', label: 'Ending IP Address (192.168.10.x)', key: 'dhcp.end', min: 2, max: 254, disabledIf: { key: 'dhcp.on', op: 'eq', value: false } },
    ] },
    { id: 'access', title: 'Access Control', crumbs: ['Advanced', 'Security', 'Access Control'], controls: [
      { id: 'access-info', type: 'info', text: 'MAC address filtering allows only devices whose MAC addresses are on the allowed list to join the network.' },
      { id: 'mac-filter', type: 'toggle', label: 'MAC address filtering', key: 'mac.filter' },
    ] },
  ],
  goals: [
    { id: 'staff-wpa3', text: 'Use WPA3 Personal on the staff network', check: { key: 'wifi.security', op: 'eq', value: 'WPA3 Personal' },
      why: 'Every staff device supports WPA3, so the staff network can use WPA3 Personal only. Its SAE handshake resists offline password guessing and gives forward secrecy. WPA2/WPA3 Transitional would let the WPA2-only gadgets join too, but the Wi-Fi Alliance notes the trade-off: the shared password can then be found with an offline dictionary attack on a WPA2 device, and it opens the staff network. Give those gadgets their own network instead.',
      expect: 'Wireless > Security is WPA3 Personal.',
      hints: ['The old router settings are still WPA2, but every staff device can do better.', 'Open Wireless and choose the strongest mode, since the WPA2-only gadgets will get their own network.', 'Wireless > Security > WPA3 Personal.'],
      src: ['wfaWpa3', 'wfaDeploy', 'appleRouter', 'cisaHome'] },
    { id: 'iot-network', text: 'Put the smart devices on their own isolated network', check: { all: [{ key: 'iot.enabled', op: 'eq', value: true }, { key: 'iot.lan', op: 'eq', value: false }] },
      why: 'Smart devices that need only the internet belong on a separate network that cannot reach the staff computers or the NAS. CISA notes this keeps them from discovering other devices, so a compromised thermostat cannot attack the office. A network for them helps only with access to the main network turned off.',
      expect: 'IoT Network: Enable IoT network on, Allow devices on this network to access the main network off.',
      hints: ['The thermostat and intercom should not share a network with the staff laptops.', 'Open IoT Network, switch it on, and block its access to the main network.', 'IoT Network: Allow devices on this network to access the main network off; Enable IoT network on.'],
      src: ['cisaUpskill', 'cisaEnterpriseWireless', 'wfaDeploy'] },
    { id: 'iot-security', text: 'Secure the IoT network with its own password', check: { all: [{ key: 'iot.security', op: 'in', value: ['WPA2 Personal (AES)', 'WPA2/WPA3 Transitional'] }, ...strongPassword('iot.password'), ...STUDIO_IOT_EXTRA, { key: 'iot.password', op: 'ne', value: STUDIO_STAFF_PASSWORD }, differentFrom('iot.password', 'wifi.password')] },
      why: 'The thermostat and intercom support only WPA2 Personal, so this network uses WPA2 Personal (AES), or Transitional, never None, WEP or TKIP. It gets its own long password: in the Wi-Fi Alliance two-network design the WPA3 staff password is never used with WPA2, so a guessed IoT password does not open the staff network.',
      expect: 'IoT Network: Security WPA2 Personal (AES) or WPA2/WPA3 Transitional, with a new password of 16 or more characters that is not the staff password or a near copy of it and does not contain the business or a network name (Larkspur, LDS-Staff, LDS-Devices). Choose unrelated random words or a password-manager-generated value, and do not reuse it.',
      hints: ['The gadgets can do WPA2 only, and their network must not share the staff password.', 'On IoT Network, pick the WPA2 AES mode and type a new long password.', 'IoT Network > Security > WPA2 Personal (AES); IoT Wi-Fi password: Fern-Copper-Signal-Lake-73 (any new passphrase of 16 or more characters).'],
      src: ['wfaDeploy', 'appleRouter', 'cisaUpskill', 'cisaPasswords'] },
    { id: 'dhcp-range', text: 'Move the DHCP pool clear of the static addresses', check: { all: [{ key: 'dhcp.on', op: 'eq', value: true }, { any: Array.from({ length: 106 }, (_, i) => 50 + i).map((start) => ({ all: [{ key: 'dhcp.start', op: 'eq', value: start }, { key: 'dhcp.end', op: 'gte', value: start + 99 }] })) }] },
      why: 'The DHCP server hands out addresses only from its pool. The printer and NAS have static addresses inside the old pool (.2 to .254), so DHCP could hand .10 or .11 to a laptop and two devices would share one address. Start the pool above the block kept for static devices; NETGEAR notes you can save part of the range for devices with fixed addresses. Starting at .50 and ending at .254 leaves 205 addresses.',
      expect: 'LAN Setup: Use Router as DHCP Server on, Starting IP Address .50 or higher, and at least 100 addresses from Starting to Ending IP Address (for example .50 to .254).',
      hints: ['The static printer and NAS addresses sit inside the range DHCP hands out.', 'Open LAN Setup and raise the Starting IP Address above .49, keeping at least 100 addresses in the pool.', 'LAN Setup > Starting IP Address: 50 (Ending IP Address stays 254).'],
      src: ['ngDhcpPool', 'ngReserve', 'appleRouter'] },
  ],
  traps: [
    { id: 'mac-filter', check: { key: 'mac.filter', op: 'eq', value: true },
      message: 'MAC address filtering looks like a lock, but do not rely on it: MAC addresses can be copied or spoofed, and filtering does not stop anyone monitoring traffic. It also adds work every time a device is added. Turn MAC address filtering off and rely on WPA3, separate networks and strong passwords.',
      why: 'MAC filtering is a weak control; real Wi-Fi security is the security mode and the password.',
      src: ['appleRouter'] },
    { id: 'weak-security', critical: true, check: { any: [{ key: 'wifi.security', op: 'in', value: WEAK_MODES }, { all: [{ key: 'iot.enabled', op: 'eq', value: true }, { key: 'iot.security', op: 'in', value: WEAK_MODES }] }] },
      message: 'A network is now open or using WEP or TKIP. None lets anyone join, and WEP and TKIP are weak legacy settings. Old devices are not a reason to step down: use WPA2 Personal (AES) for the WPA2-only gadgets and WPA3 Personal for staff. Tip: set security on a new network before you switch it on.',
      why: 'Never use None, WEP or TKIP; WPA2 AES is the floor.',
      src: ['appleRouter', 'cisaUpskill'] },
    { id: 'dhcp-off', critical: true, check: { key: 'dhcp.on', op: 'eq', value: false },
      message: 'Use Router as DHCP Server is off. The router is the only DHCP server here, so laptops and phones stop getting addresses when they join. To keep addresses free for static devices, shrink the pool instead. Turn the DHCP server back on.',
      why: 'Keep the router DHCP server on when it is the only one; change the pool, not the server.',
      src: ['appleRouter', 'ngDhcpPool'] },
    { id: 'weak-password', check: { any: [weakNewPassword('iot.password', '', STUDIO_IOT_EXTRA), weakNewPassword('wifi.password', STUDIO_STAFF_PASSWORD, STUDIO_WIFI_EXTRA)] },
      message: 'That new Wi-Fi password is too short or easy to guess: it is under 16 characters, repeats a character or a short chunk, contains a keyboard or number run such as qwerty or 123456, is made only of common passwords such as password or admin plus numbers and symbols, contains the business or a network name (Larkspur, LDS-Staff, LDS-Devices), or is the other Wi-Fi password with only a few characters changed. A near copy of the staff password on the WPA2 IoT network exposes the staff password to the same offline guessing. The IoT network uses WPA2 Personal, which is open to offline guessing, and the staff network protects the laptops and the NAS, so both passwords matter. Type a passphrase of 5 to 7 unrelated random words, or a password-manager-generated value.',
      why: 'Length alone is not strength: a long run of one character, a common word, or the name of the business or its network is guessed first, and a near copy of one password falls with the other. Use 16 or more characters, random, never reused.',
      src: ['cisaPasswords', 'wfaDeploy'] },
    { id: 'equal-password', check: samePassword('iot.password', 'wifi.password'),
      message: 'The IoT Wi-Fi password and the staff Wi-Fi password are the same. The thermostat and intercom use WPA2, where the password can be found with an offline dictionary attack; that one password would then also open the WPA3 staff network. The Wi-Fi Alliance two-network design gives the WPA2 network a different password so the WPA3 password is never used with WPA2. Give each network its own passphrase.',
      why: 'Separate networks protect only when their passwords differ. Reusing the staff password on the WPA2 network exposes it to offline guessing.',
      src: ['wfaDeploy', 'cisaPasswords'] },
  ],
  solution: [
    { do: { type: 'open', screenId: 'wireless' }, explain: 'Open Wireless for the staff network.' },
    { do: { type: 'set', controlId: 'security', value: 'WPA3 Personal' }, explain: 'Every staff device supports WPA3, so use WPA3 Personal only.' },
    { do: { type: 'open', screenId: 'iot' }, explain: 'Open IoT Network for the thermostat and intercom.' },
    { do: { type: 'set', controlId: 'iot-security', value: 'WPA2 Personal (AES)' }, explain: 'Set security before switching the network on. The gadgets support only WPA2, so WPA2 Personal (AES).' },
    { do: { type: 'set', controlId: 'iot-password', value: 'Fern-Copper-Signal-Lake-73' }, explain: 'A separate long password, so the staff password is never used with WPA2.' },
    { do: { type: 'set', controlId: 'iot-lan', value: false }, explain: 'Block the IoT network from the main network.' },
    { do: { type: 'set', controlId: 'iot-enable', value: true }, explain: 'Switch the IoT network on.' },
    { do: { type: 'open', screenId: 'lan' }, explain: 'Open LAN Setup.' },
    { do: { type: 'set', controlId: 'dhcp-start', value: 50 }, explain: 'Start the pool at .50: .2 to .49 stay free for static devices and .50 to .254 gives 205 addresses.' },
  ],
  trapDemo: [
    { do: { type: 'open', screenId: 'access' } },
    { do: { type: 'set', controlId: 'mac-filter', value: true } },
    { do: { type: 'open', screenId: 'lan' } },
    { do: { type: 'set', controlId: 'dhcp', value: false } },
    { do: { type: 'open', screenId: 'wireless' } },
    { do: { type: 'set', controlId: 'security', value: 'WEP' } },
    { do: { type: 'open', screenId: 'iot' } },
    { do: { type: 'set', controlId: 'iot-security', value: 'WPA2 Personal (AES)' } },
    { do: { type: 'set', controlId: 'iot-password', value: '1111111111111111' } },
    { do: { type: 'set', controlId: 'iot-password', value: 'Larkspur-Studio-Thermostat-Door' } },
    { do: { type: 'set', controlId: 'iot-password', value: STUDIO_STAFF_PASSWORD } },
  ],
  src: ['wfaWpa3', 'wfaDeploy', 'appleRouter', 'cisaUpskill', 'ngDhcpPool', 'cisaPasswords'],
};

export default [router01, router02, router03, router04, router05, router06];
