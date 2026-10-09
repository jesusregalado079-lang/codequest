export const LABELS = {
  'brute-force': 'Brute-force password guessing', spraying: 'Password spraying', stuffing: 'Credential stuffing',
  sqli: 'SQL injection', traversal: 'Directory traversal', xss: 'Cross-site scripting',
  'cmd-injection': 'Command injection', 'port-scan': 'Port scan', 'impossible-travel': 'Impossible travel',
  'priv-esc': 'Privilege escalation', 'dns-tunnel': 'DNS tunneling or exfiltration', beaconing: 'C2 beaconing',
  ransomware: 'Ransomware encryption', 'syn-flood': 'SYN flood denial of service', lateral: 'Lateral movement',
  'account-creation': 'Unauthorized account creation', 'account-lockout': 'Account lockout',
  'normal-polling': 'Approved scheduled polling',
  'rogue-dhcp': 'Rogue DHCP server', 'dhcp-starvation': 'DHCP address pool starvation',
  'arp-spoof': 'ARP spoofing', 'mac-flap': 'MAC address flapping',
  'port-security': 'Switch port-security violation', 'dns-amplification': 'DNS amplification',
  'tls-cert': 'TLS certificate validation failure',
};
export const sources = {
  'ms-events': ['Windows security events to monitor', 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/Appendix-L--Events-to-Monitor'],
  'ms-4624': ['Event 4624 successful logon', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624'],
  sshd: ['OpenSSH sshd manual', 'https://man7.org/linux/man-pages/man8/sshd.8.html'],
  spray: ['MITRE password spraying', 'https://attack.mitre.org/techniques/T1110/003/'],
  brute: ['MITRE ATT&CK T1110: Brute Force', 'https://attack.mitre.org/techniques/T1110/'],
  stuffing: ['MITRE credential stuffing', 'https://attack.mitre.org/techniques/T1110/004/'],
  web: ['OWASP injection flaws', 'https://community.owasp.org/Injection_Flaws'],
  traversal: ['OWASP path traversal', 'https://community.owasp.org/attacks/Path_Traversal'],
  sqli: ['OWASP SQL injection', 'https://community.owasp.org/attacks/SQL_Injection'],
  c2: ['MITRE web protocol command and control', 'https://attack.mitre.org/techniques/T1071/001/'],
  dns: ['MITRE DNS command and control', 'https://attack.mitre.org/techniques/T1071/004/'],
  'ms-4740': ['Event 4740: A user account was locked out', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4740'],
  'ms-4722': ['Event 4722: A user account was enabled', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4722'],
  'mitre-groups': ['MITRE ATT&CK T1098.007: Additional Local or Domain Groups', 'https://attack.mitre.org/techniques/T1098/007/'],
  'dhcp-attack': ['MITRE ATT&CK T1557.003: DHCP Spoofing', 'https://attack.mitre.org/techniques/T1557/003/'],
  'arp-attack': ['MITRE ATT&CK T1557.002: ARP Cache Poisoning', 'https://attack.mitre.org/techniques/T1557/002/'],
  'cisco-flap': ['Cisco: Troubleshoot MAC Address Flap Notification Error', 'https://www.cisco.com/c/en/us/support/docs/ip/syslog/221140-troubleshoot-mac-address-flap-notificati.html'],
  'cisco-port': ['Cisco Catalyst Switch System Message Guide: Port Security', 'https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750/software/release/12-2_53_se/system/message/122s_sysmsg/msg_desc.html'],
  'cisco-dhcp': ['Cisco Catalyst Switch System Message Guide: DHCP Snooping', 'https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750/software/release/12-2_53_se/system/message/122s_sysmsg/msg_desc.html'],
  tls: ['RFC 8446: The Transport Layer Security Protocol Version 1.3', 'https://www.rfc-editor.org/rfc/rfc8446'],
  'tls-name': ['RFC 9525: Service Identity in TLS', 'https://www.rfc-editor.org/rfc/rfc9525'],
  'dns-amplify': ['RFC 6950: Architectural Considerations on Application Features in the DNS', 'https://www.rfc-editor.org/info/rfc6950/'],
  'cisa-amp': ['CISA: UDP-Based Amplification Attacks', 'https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks'],
};
export default [
  { id: 'logs-01', level: 1, title: 'First login clues', objs: ['2.5','4.8'], examObjs: { 'netplus-009': ['3.2'], 'aplus-1202': ['2.5'] },
    labels: ['brute-force','spraying','port-scan','sqli','account-lockout','lateral'], snippets: [
      { source: 'Linux auth.log', lines: [
        'Oct 14 03:12:01 web1 sshd[2211]: Failed password for root from 198.51.100.23 port 51122 ssh2',
        'Oct 14 03:12:03 web1 sshd[2212]: Failed password for root from 198.51.100.23 port 51124 ssh2',
        'Oct 14 03:12:05 web1 sshd[2213]: Failed password for root from 198.51.100.23 port 51130 ssh2'], answer: 'brute-force', why: 'All three Failed password lines target root from one IP. Repeated guesses at one account indicate brute force; exam clues contrast this with one guess per many accounts.' },
      { source: 'Windows Security, compact event view', lines: [
        '09:10:01 Event 4625 Account Name: ava Source Network Address: 203.0.113.18 Logon Type: 3',
        '09:10:08 Event 4625 Account Name: ben Source Network Address: 203.0.113.18 Logon Type: 3',
        '09:10:15 Event 4625 Account Name: cy Source Network Address: 203.0.113.18 Logon Type: 3'], answer: 'spraying', why: 'The three 4625 failures come from one IP but target ava, ben, and cy once each. Many accounts with few attempts each is the exam clue for spraying.' },
      { source: 'Firewall connection log', lines: [
        '10:03:11 deny tcp 203.0.113.45:44120 10.0.1.12:21',
        '10:03:11 deny tcp 203.0.113.45:44121 10.0.1.12:22',
        '10:03:12 deny tcp 203.0.113.45:44122 10.0.1.12:23',
        '10:03:12 deny tcp 203.0.113.45:44123 10.0.1.12:25'], answer: 'port-scan', why: 'One source probes ports 21, 22, 23, and 25 on the same host within a second. Many destination ports, rather than password failures, point to a scan.' },
      { source: 'Apache access log', lines: [
        '203.0.113.60 - - [14/Oct/2026:10:22:14 +0000] "GET /item?id=7%27%20OR%201%3D1-- HTTP/1.1" 403 226 "-" "-"',
        '203.0.113.60 - - [14/Oct/2026:10:22:16 +0000] "GET /item?id=8%27%20OR%201%3D1-- HTTP/1.1" 403 226 "-" "-"',
        '203.0.113.60 - - [14/Oct/2026:10:22:18 +0000] "GET /item?id=9%27%20OR%201%3D1-- HTTP/1.1" 403 226 "-" "-"'], answer: 'sqli', why: 'All three GET lines place an encoded quote, OR 1=1, and SQL comment syntax in the id parameter. The 403 status means the attempt was blocked, not that it succeeded.' },
    ], src: ['sshd','ms-events','sqli'] },
  { id: 'logs-02', level: 1, title: 'Web and account triage', objs: ['2.4','2.5','4.8'], examObjs: { 'netplus-009': ['3.2'], 'aplus-1202': ['2.5'] },
    labels: ['traversal','xss','account-creation','account-lockout','sqli','port-scan'], snippets: [
      { source: 'Apache access log', lines: [
        '198.51.100.8 - - [14/Oct/2026:11:04:02 +0000] "GET /download?file=../../etc/passwd HTTP/1.1" 403 199 "-" "-"',
        '198.51.100.8 - - [14/Oct/2026:11:04:03 +0000] "GET /download?file=../../etc/shadow HTTP/1.1" 403 199 "-" "-"',
        '198.51.100.8 - - [14/Oct/2026:11:04:04 +0000] "GET /download?file=../../../etc/passwd HTTP/1.1" 403 199 "-" "-"'], answer: 'traversal', why: 'The file parameter uses ../ sequences to climb out of the download directory and request /etc files. That is directory traversal; 403 shows denial only.' },
      { source: 'Apache access log', lines: [
        '203.0.113.22 - - [14/Oct/2026:11:18:00 +0000] "GET /search?q=%3Cscript%3Ealert(1)%3C/script%3E HTTP/1.1" 400 211 "-" "-"',
        '203.0.113.22 - - [14/Oct/2026:11:18:02 +0000] "GET /search?q=%3Csvg%20onload%3Dalert(1)%3E HTTP/1.1" 400 211 "-" "-"',
        '203.0.113.22 - - [14/Oct/2026:11:18:04 +0000] "GET /search?q=%3Cscript%3Ealert(2)%3C/script%3E HTTP/1.1" 400 211 "-" "-"'], answer: 'xss', why: 'The q parameter carries encoded script and SVG onload markup in every line. These are cross-site scripting payloads; the 400 responses do not prove execution.' },
      { source: 'Windows Security, compact event view', lines: [
        '11:22:10 Event 4720 A user account was created. New Account Name: svc-audit2 Subject Account Name: admin1',
        '11:22:12 Event 4722 A user account was enabled. Target Account Name: svc-audit2 Subject Account Name: admin1',
        '11:22:14 Event 4624 An account was successfully logged on. Account Name: svc-audit2 Logon Type: 2'], answer: 'account-creation', why: 'Event 4720 creates svc-audit2 and 4722 enables it. No group change appears, so the clue is account creation; confirm it against a change ticket.' },
      { source: 'Windows Security, compact event view', lines: [
        '11:38:01 Event 4625 Account Name: ava Workstation Name: WS-04 Source Network Address: 10.0.2.44 Logon Type: 3',
        '11:38:04 Event 4625 Account Name: ava Workstation Name: WS-04 Source Network Address: 10.0.2.44 Logon Type: 3',
        '11:38:05 Event 4740 A user account was locked out. Account Name: ava Caller Computer Name: WS-04'], answer: 'account-lockout', why: "Two 4625 failures from ava's own workstation WS-04 end in Event 4740. The decisive evidence is the lockout itself; Security+ lists account lockout as an indicator. One internal source and one account do not show a guessing campaign." },
    ], src: ['traversal','ms-4722','ms-4740'] },
  { id: 'logs-03', level: 2, title: 'Movement and escalation', objs: ['2.5','4.4','4.8'], examObjs: { 'aplus-1202': ['2.4'] },
    labels: ['lateral','priv-esc','ransomware','beaconing','brute-force','port-scan','syn-flood'], snippets: [
      { source: 'Windows Security, compact event view', lines: [
        '12:05:11 APP1 Event 4624 Account Name: ops1 Logon Type: 3 Source Network Address: 10.0.4.25',
        '12:06:42 DB1 Event 4624 Account Name: ops1 Logon Type: 3 Source Network Address: 10.0.4.25',
        '12:07:09 FILE1 Event 4624 Account Name: ops1 Logon Type: 3 Source Network Address: 10.0.4.25'], answer: 'lateral', why: 'The same ops1 account logs on over the network, Logon Type 3, to APP1, DB1, then FILE1 from one workstation. Movement across hosts is the clue; a 4624 alone only means success.' },
      { source: 'Windows Security, compact event view', lines: [
        '12:13:50 WS-09 Event 4624 Account Name: kiosk1 Logon Type: 2',
        '12:14:07 WS-09 Event 4732 Member added to local group. Member: kiosk1 Group: Administrators Subject Account Name: ops1',
        '12:14:11 WS-09 Event 4672 Special privileges assigned to new logon. Account Name: kiosk1'], answer: 'priv-esc', why: 'Existing standard account kiosk1 is added to Administrators (4732) and then gets a privileged logon (4672). Gaining admin rights is privilege escalation.' },
      { source: 'EDR file activity', lines: [
        '12:20:01 WS-09 process=locker.exe action=rename path=C:\\Shares\\plans.docx to=C:\\Shares\\plans.docx.locked',
        '12:20:02 WS-09 process=locker.exe action=rename path=C:\\Shares\\budget.xlsx to=C:\\Shares\\budget.xlsx.locked',
        '12:20:03 WS-09 process=locker.exe action=write path=C:\\Shares\\READ_ME.txt'], answer: 'ransomware', why: 'One process rapidly renames different documents to .locked and writes READ_ME.txt. Combined mass file changes and note point to ransomware; a single rename would not.' },
      { source: 'Proxy connection summary', lines: [
        '12:30:00 WS-09 to 203.0.113.84:443 GET /check 200 bytes_out=208',
        '12:31:00 WS-09 to 203.0.113.84:443 GET /check 200 bytes_out=208',
        '12:32:00 WS-09 to 203.0.113.84:443 GET /check 200 bytes_out=208',
        '12:33:00 WS-09 to 203.0.113.84:443 GET /check 200 bytes_out=208'], answer: 'beaconing', why: 'Four identical requests to one external IP occur exactly 60 seconds apart with identical size. Regular repeated check-ins suggest beaconing; corroborate with process and destination context.' },
    ], src: ['ms-events','c2','mitre-groups'] },
  { id: 'logs-04', level: 2, title: 'Network and web signals', objs: ['2.4','2.5','4.8'], examObjs: { 'netplus-009': ['4.2'], 'aplus-1202': ['2.5'] },
    labels: ['cmd-injection','dns-tunnel','syn-flood','stuffing','traversal','xss','beaconing'], snippets: [
      { source: 'Apache access log and application audit', lines: [
        '198.51.100.40 - - [14/Oct/2026:13:01:00 +0000] "GET /diag?host=10.0.1.2%3Bid HTTP/1.1" 200 114 "-" "-"',
        '13:01:00 app audit: diag child process=/bin/sh args="-c ping -c 1 10.0.1.2;id"',
        '13:01:00 app audit: child stdout="uid=33(www-data) gid=33(www-data) groups=33(www-data)"'], answer: 'cmd-injection', why: 'The encoded semicolon in host is passed into a shell, and the next line prints id output. Command execution proves injection; ../ path segments would indicate traversal instead.' },
      { source: 'DNS query log', lines: [
        '13:10:01 10.0.3.19 TXT a91f04d83b2c7e91.collect.cdn-telemetry.example NOERROR',
        '13:10:02 10.0.3.19 TXT b10e74c39a2d8f04.collect.cdn-telemetry.example NOERROR',
        '13:10:03 10.0.3.19 TXT c991e2a7780f3b52.collect.cdn-telemetry.example NOERROR',
        '13:10:04 10.0.3.19 TXT d5b721e0c43a9f66.collect.cdn-telemetry.example NOERROR'], answer: 'dns-tunnel', why: 'Rapid TXT lookups carry different long hex-like subdomains under one outside zone. Encoded data in changing query names is the DNS tunneling clue, not ordinary resolution.' },
      { source: 'Firewall connection log', lines: [
        '13:20:00 allow tcp SYN 203.0.113.11:41001 10.0.1.10:443',
        '13:20:00 allow tcp SYN 203.0.113.12:41002 10.0.1.10:443',
        '13:20:00 allow tcp SYN 203.0.113.13:41003 10.0.1.10:443',
        '13:20:00 alert SYN rate=12000/s dst=10.0.1.10:443 half_open=9200'], answer: 'syn-flood', why: 'Many SYN packets converge on one service, and the alert reports 9200 half-open connections. That volume and incomplete handshakes indicate a SYN flood.' },
      { source: 'Identity sign-in audit, compact view', lines: [
        '13:30:00 login user=ava src=198.51.100.10 result=fail password_id=leaked-set-01',
        '13:30:01 login user=ben src=198.51.100.10 result=success password_id=leaked-set-02',
        '13:30:02 login user=cy src=198.51.100.10 result=fail password_id=leaked-set-03'], answer: 'stuffing', why: 'The audit identifies three distinct passwords from a leaked set tested against matching accounts, with one success. Reused stolen pairs are credential stuffing; one password across accounts is spraying.' },
    ], src: ['web','dns','stuffing'] },
  { id: 'logs-05', level: 3, title: 'Similar looking login patterns', objs: ['2.5','4.4','4.8'], examObjs: { 'netplus-009': ['3.2'], 'aplus-1202': ['2.5'] },
    labels: ['spraying','brute-force','stuffing','impossible-travel','beaconing','lateral','account-lockout'], snippets: [
      { source: 'Identity sign-in audit, compact view', lines: [
        '14:00:00 user=ava src=203.0.113.44 result=fail attempt=1 campaign=autumn-guess',
        '14:00:03 user=ben src=203.0.113.44 result=fail attempt=1 campaign=autumn-guess',
        '14:00:07 user=cy src=203.0.113.44 result=fail attempt=1 campaign=autumn-guess',
        '14:00:10 user=dee src=203.0.113.44 result=fail attempt=1 campaign=autumn-guess'], answer: 'spraying', why: 'Each of four accounts has just attempt 1 from the same IP. Breadth across users with low per-user count fits spraying; passwords are not logged, so do not claim a known literal password.' },
      { source: 'Linux auth.log', lines: [
        'Oct 14 14:05:01 bastion sshd[4101]: Failed password for ops from 198.51.100.54 port 50101 ssh2',
        'Oct 14 14:05:02 bastion sshd[4102]: Failed password for ops from 198.51.100.54 port 50102 ssh2',
        'Oct 14 14:05:03 bastion sshd[4103]: Failed password for ops from 198.51.100.54 port 50103 ssh2',
        'Oct 14 14:05:04 bastion sshd[4104]: Failed password for ops from 198.51.100.54 port 50104 ssh2'], answer: 'brute-force', why: 'All four sshd failures target ops from the same IP within seconds. Repeated attempts at one account distinguish password guessing from a broad spray.' },
      { source: 'Identity sign-in audit, compact view', lines: [
        '14:10:00 user=ava src=198.51.100.55 result=fail credential_source=exposed-pair-17',
        '14:10:01 user=ben src=198.51.100.55 result=success credential_source=exposed-pair-18',
        '14:10:02 user=cy src=198.51.100.55 result=fail credential_source=exposed-pair-19'], answer: 'stuffing', why: 'Each user is tried with a different explicitly identified exposed credential pair. That is stuffing; ordinary 4625 events alone could not establish where passwords came from.' },
      { source: 'Identity sign-in audit, compact view', lines: [
        '14:20:00 user=ava result=success src=192.0.2.21 region=Region-A session=s-101',
        '14:29:00 user=ava result=success src=203.0.113.90 region=Region-B session=s-102',
        '14:29:01 risk rule: Region-A to Region-B minimum travel time=11h observed=9m'], answer: 'impossible-travel', why: 'Two successful sign-ins for ava are nine minutes apart, while the risk rule states at least 11 hours between regions. Impossible travel is a risk signal, not proof of account takeover.' },
    ], src: ['spray','stuffing','sshd'] },
  { id: 'logs-06', level: 3, title: 'Close calls in web and traffic', objs: ['2.4','2.5','4.4','4.8'], examObjs: { 'netplus-009': ['3.2'], 'aplus-1202': ['2.5'] },
    labels: ['traversal','cmd-injection','sqli','beaconing','normal-polling','dns-tunnel','xss','lateral'], snippets: [
      { source: 'Apache access log', lines: [
        '203.0.113.70 - - [14/Oct/2026:15:00:00 +0000] "GET /files?name=../../private/roster.csv HTTP/1.1" 403 220 "-" "-"',
        '203.0.113.70 - - [14/Oct/2026:15:00:01 +0000] "GET /files?name=..%2F..%2Fprivate%2Froster.csv HTTP/1.1" 403 220 "-" "-"',
        '203.0.113.70 - - [14/Oct/2026:15:00:02 +0000] "GET /files?name=../../../private/roster.csv HTTP/1.1" 403 220 "-" "-"'], answer: 'traversal', why: 'All three name values climb directories, both literally and URL encoded. They try to read a file outside the allowed directory; no shell metacharacter or executed command appears.' },
      { source: 'Apache access log and application audit', lines: [
        '203.0.113.71 - - [14/Oct/2026:15:04:00 +0000] "GET /check?host=10.0.1.2%7Cwhoami HTTP/1.1" 200 90 "-" "-"',
        '15:04:00 app audit: child process=/bin/sh args="-c ping -c 1 10.0.1.2|whoami"',
        '15:04:00 app audit: child stdout="www-data"'], answer: 'cmd-injection', why: 'The encoded pipe reaches /bin/sh and whoami prints www-data. This proves shell command injection; unlike traversal, it executes a second command.' },
      { source: 'Apache access log', lines: [
        '203.0.113.72 - - [14/Oct/2026:15:10:00 +0000] "GET /item?id=4%27%20UNION%20SELECT%20name%20FROM%20users-- HTTP/1.1" 403 220 "-" "-"',
        '203.0.113.72 - - [14/Oct/2026:15:10:02 +0000] "GET /item?id=5%27%20UNION%20SELECT%20name%20FROM%20users-- HTTP/1.1" 403 220 "-" "-"',
        '203.0.113.72 - - [14/Oct/2026:15:10:04 +0000] "GET /item?id=6%27%20UNION%20SELECT%20name%20FROM%20users-- HTTP/1.1" 403 220 "-" "-"'], answer: 'sqli', why: 'All three id values contain an encoded quote, UNION SELECT, and SQL comment syntax. The 403 responses show blocked attempts, not successful database access.' },
      { source: 'Proxy summary and approved task record', lines: [
        '15:00:00 WS-12 process=inventory-agent.exe dst=10.0.2.10:443 GET /inventory bytes_out=208',
        '15:05:00 WS-12 process=inventory-agent.exe dst=10.0.2.10:443 GET /inventory bytes_out=208',
        '15:10:00 WS-12 process=inventory-agent.exe dst=10.0.2.10:443 GET /inventory bytes_out=208',
        '15:10:01 task record: inventory-agent.exe approved; runs every 5 minutes; destination=10.0.2.10'], answer: 'normal-polling', why: 'The task record explicitly approves inventory-agent.exe every five minutes to an internal destination. Regular timing alone is not beaconing; exams require process and destination context.' },
      { source: 'Proxy connection summary', lines: [
        '15:30:00 WS-18 process=tmp-sync.exe dst=198.51.100.88:443 GET /stage bytes_out=311',
        '15:30:45 WS-18 process=tmp-sync.exe dst=198.51.100.88:443 GET /stage bytes_out=311',
        '15:31:30 WS-18 process=tmp-sync.exe dst=198.51.100.88:443 GET /stage bytes_out=311',
        '15:32:15 WS-18 process=tmp-sync.exe dst=198.51.100.88:443 GET /stage bytes_out=311'], answer: 'beaconing', why: 'The unapproved tmp-sync process contacts the same external IP every 45 seconds with the same path and size. That combination supports beaconing, unlike approved internal scheduled polling.' },
    ], src: ['traversal','web','c2'] },
  { id: 'logs-07', level: 3, title: 'DHCP and access switch clues', objs: ['2.5','4.4','4.8'], examObjs: { 'netplus-009': ['3.2','4.2','5.3'] },
    labels: ['rogue-dhcp','dhcp-starvation','arp-spoof','mac-flap','port-security','spraying','dns-tunnel'], snippets: [
      { source: 'DHCP sensor, normalized packet view', lines: [
        '08:01:03 DHCP DISCOVER client=02:10:20:30:40:51 xid=0x1201 vlan=20',
        '08:01:03 DHCP OFFER server=10.20.0.99 yiaddr=10.20.0.88 router=10.20.0.99 xid=0x1201',
        '08:01:04 DHCP OFFER server=10.20.0.5 yiaddr=10.20.0.88 router=10.20.0.1 xid=0x1201',
        '08:01:04 inventory: approved DHCP server=10.20.0.5 router=10.20.0.1'], answer: 'rogue-dhcp', why: 'Two servers offer the same client a lease. The offer from 10.20.0.99 advertises itself as the router, while inventory approves only 10.20.0.5. A rogue server can hand out a bad gateway; the clue is the unapproved OFFER.' },
      { source: 'DHCP server allocation audit', lines: [
        '08:10:00 DHCP DISCOVER chaddr=02:30:00:00:00:01 source_port=Gi1/0/8',
        '08:10:00 DHCP DISCOVER chaddr=02:30:00:00:00:02 source_port=Gi1/0/8',
        '08:10:01 DHCP DISCOVER chaddr=02:30:00:00:00:03 source_port=Gi1/0/8',
        '08:10:02 scope 10.20.0.0/24 free_leases=0 requests_last_2s=230 distinct_chaddr=230'], answer: 'dhcp-starvation', why: 'Three sample DISCOVER lines show changing client MACs on one port; the summary counts 230 distinct clients in two seconds and no free leases. That is DHCP pool exhaustion, not a server OFFER.' },
      { source: 'ARP sensor, normalized frame view', lines: [
        '08:20:01 ARP reply sender_ip=10.20.0.1 sender_mac=02:aa:bb:cc:dd:99 recv=10.20.0.44',
        '08:20:03 ARP reply sender_ip=10.20.0.1 sender_mac=02:aa:bb:cc:dd:99 recv=10.20.0.45',
        '08:20:04 inventory: gateway 10.20.0.1 approved_mac=02:aa:bb:cc:dd:01'], answer: 'arp-spoof', why: 'Both replies claim the gateway IP from a MAC that differs from the approved gateway MAC. The forged IP-to-MAC mapping is ARP spoofing; it is not a DHCP lease or a switch MAC-flap event.' },
      { source: 'Access switch syslog', lines: [
        'Oct 14 08:30:01 SW1 %SW_MATM-4-MACFLAP_NOTIF: Host 0211.2233.4455 in vlan 20 is flapping between port Gi1/0/10 and port Gi1/0/11.',
        'Oct 14 08:30:03 SW1 %SW_MATM-4-MACFLAP_NOTIF: Host 0211.2233.4455 in vlan 20 is flapping between port Gi1/0/11 and port Gi1/0/10.',
        'Oct 14 08:30:04 SW1 show mac address-table: 0211.2233.4455 vlan 20 Gi1/0/10'], answer: 'mac-flap', why: 'The first two alerts explicitly show one MAC moving between two ports in the same VLAN. This can indicate a loop or duplicate MAC; the logs alone do not prove ARP spoofing.' },
    ], src: ['dhcp-attack','arp-attack','cisco-flap'] },
  { id: 'logs-08', level: 3, title: 'Remote access and service failures', objs: ['2.5','4.4','4.8'], examObjs: { 'netplus-009': ['3.2','4.2'], 'aplus-1202': ['2.5'] },
    labels: ['spraying','dns-amplification','brute-force','tls-cert','port-security','mac-flap','dns-tunnel','normal-polling'], snippets: [
      { source: 'Windows Security, RDP host with NLA, compact event view', lines: [
        '09:02:01 Event 4625 Account Name: ava Source Network Address: 203.0.113.29 Logon Type: 3 Status: 0xC000006D',
        '09:02:04 Event 4625 Account Name: ben Source Network Address: 203.0.113.29 Logon Type: 3 Status: 0xC000006D',
        '09:02:07 Event 4625 Account Name: cyd Source Network Address: 203.0.113.29 Logon Type: 3 Status: 0xC000006D'], answer: 'spraying', why: 'All three 4625 failures are network logons, type 3, from one source against three accounts once each. With NLA, authentication fails before a remote interactive RDP session starts. That breadth indicates password spraying, not repeated guesses at one user.' },
      { source: 'Edge flow summary', lines: [
        '09:10:00 udp src=192.0.2.53:53 dst=10.0.8.40:51001 bytes=4096',
        '09:10:00 udp src=198.51.100.53:53 dst=10.0.8.40:51002 bytes=4096',
        '09:10:01 udp src=203.0.113.53:53 dst=10.0.8.40:51003 bytes=4096',
        '09:10:01 sensor: victim=10.0.8.40 dns_responses_in=48210 matching_queries_out=0 inbound_bps=390000000'], answer: 'dns-amplification', why: 'Large UDP responses from source port 53 at three different resolvers converge on one host, and the sensor shows that host sent no matching queries. Unsolicited, reflected DNS responses flooding one victim indicate DNS amplification, a reflected DDoS. Tunneling would show the inside host sending unusual query names instead.' },
      { source: 'Windows Security, RDP host with NLA, compact event view', lines: [
        '09:20:01 Event 4625 Account Name: admin1 Source Network Address: 198.51.100.29 Logon Type: 3 Status: 0xC000006D',
        '09:20:03 Event 4625 Account Name: admin1 Source Network Address: 198.51.100.29 Logon Type: 3 Status: 0xC000006D',
        '09:20:05 Event 4625 Account Name: admin1 Source Network Address: 198.51.100.29 Logon Type: 3 Status: 0xC000006D'], answer: 'brute-force', why: 'All three failed network logons target admin1 from one source. With NLA, authentication fails before a remote interactive RDP session starts. Repeated attempts against one account distinguish password guessing from the separate many-account spray.' },
      { source: 'TLS client diagnostic log', lines: [
        '09:30:01 connect host=portal.cairn-field.example ip=10.0.8.10 port=443',
        '09:30:01 peer certificate subject=CN=portal.cairn-field.example notAfter=2026-10-01T00:00:00Z',
        '09:30:01 client verification time=2026-10-14T09:30:01Z result=certificate_expired',
        '09:30:01 TLS handshake aborted before application request'], answer: 'tls-cert', why: 'The certificate expired on October 1, before the October 14 verification time. The client aborts the handshake for certificate validation, so the log does not show an application outage or DNS failure.' },
    ], src: ['spray','ms-events','cisa-amp','tls'] },
  { id: 'logs-09', level: 3, title: 'Separate root cause from symptom', objs: ['2.5','4.4','4.8'], examObjs: { 'netplus-009': ['3.2','4.2','4.3','5.3'] },
    labels: ['dhcp-starvation','rogue-dhcp','port-security','tls-cert','account-lockout','mac-flap','dns-amplification'], snippets: [
      { source: 'DHCP scope and switch port audit', lines: [
        '10:00:00 Gi1/0/7 DHCP DISCOVER chaddr=02:41:00:00:00:01',
        '10:00:00 Gi1/0/7 DHCP DISCOVER chaddr=02:41:00:00:00:02',
        '10:00:01 Gi1/0/7 DHCP DISCOVER chaddr=02:41:00:00:00:03',
        '10:00:02 scope 10.40.0.0/24: 246 leases in use, 0 available; 246 distinct MACs seen on Gi1/0/7 in 2s'], answer: 'dhcp-starvation', why: 'Three example DISCOVER packets and the scope summary tie 246 distinct MACs to one port in two seconds, leaving no leases. The evidence is pool starvation, not a second DHCP server.' },
      { source: 'DHCP snooping audit', lines: [
        '10:10:00 DHCP OFFER server=10.40.0.5 offered_ip=10.40.0.70 router=10.40.0.1 ingress=Gi1/0/1 trusted=yes',
        '10:10:00 DHCP OFFER server=10.40.0.99 offered_ip=10.40.0.70 router=10.40.0.99 ingress=Gi1/0/9 trusted=no',
        '10:10:01 SW3 %DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: 0241.0000.0099'], answer: 'rogue-dhcp', why: 'The second OFFER advertises an unapproved gateway from an untrusted access port, and snooping drops it. A rogue DHCP server attempted a lease; this evidence does not show that a client accepted it.' },
      { source: 'Access switch syslog and port configuration', lines: [
        'Oct 14 10:20:00 SW3 %PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred caused by MAC 02aa.bbcc.dd22 on port GigabitEthernet1/0/14.',
        'Oct 14 10:20:00 SW3 %PM-4-ERR_DISABLE: psecure-violation error detected on GigabitEthernet1/0/14, putting GigabitEthernet1/0/14 in err-disable state',
        'Oct 14 10:20:01 SW3 Gi1/0/14 access vlan 30; secure MAC 02aa.bbcc.dd11'], answer: 'port-security', why: 'A new MAC violates the configured secure MAC on Gi1/0/14, then the switch disables the port. The VLAN is context; there is no evidence that traffic hopped between VLANs.' },
      { source: 'TLS client diagnostic log', lines: [
        '10:30:00 connect host=files.birch-vale.example ip=10.40.2.20 port=443',
        '10:30:00 peer certificate SAN=DNS:files-old.birch-vale.example notAfter=2027-01-01T00:00:00Z',
        '10:30:00 client expected_name=files.birch-vale.example result=hostname_mismatch',
        '10:30:00 TLS handshake aborted before application request'], answer: 'tls-cert', why: 'The certificate is within its date range, but its SAN names files-old while the client requested files. A name mismatch causes certificate validation failure; the log does not prove a port block.' },
    ], src: ['dhcp-attack','cisco-dhcp','cisco-port','tls-name'] },
];
