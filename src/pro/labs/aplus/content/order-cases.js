export const sources = {
  comptiaA1: ['CompTIA A+ Core 1 (220-1201) V15 exam objectives, Troubleshooting methodology knowledge, CompTIA', 'https://www.comptia.org/en-us/certifications/a/core-1-v15/'],
  comptiaA2: ['CompTIA A+ Core 2 (220-1202) V15 exam objectives, CompTIA', 'https://www.comptia.org/en-us/certifications/a/core-2-v15/'],
  msMonitor: ['Troubleshoot external monitor connections in Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/hardware/display-graphics/troubleshoot-external-monitor-connections-in-windows'],
  nist83: ['NIST SP 800-83 Rev. 1, Guide to Malware Incident Prevention and Handling for Desktops and Laptops', 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf'],
  msDefenderOffline: ['Help protect my PC with Microsoft Defender Offline, Microsoft Support', 'https://support.microsoft.com/en-us/windows/help-protect-my-pc-with-microsoft-defender-offline-9306d528-64bf-4668-5b80-ff533f183d6c'],
  msSystemProtection: ['System Protection, Microsoft Support', 'https://support.microsoft.com/en-us/windows/experience/backup-recovery/system-protection'],
  nist128: ['NIST SP 800-128, Guide for Security-Focused Configuration Management of Information Systems (3.4 Configuration change control, Appendix E sample change request)', 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf'],
  hpImaging: ['HP LaserJet 1022 series service manual, Image-formation system and The seven image-formation processes, HP', 'https://h10032.www1.hp.com/ctg/Manual/c00631427.pdf'],
  hpLaptopService: ['HP EliteBook X G1a 14 inch Notebook Maintenance and Service Guide, Removal and replacement procedures, HP', 'https://kaas.hpcloud.hp.com/pdf-public/pdf_11496528_en-US-1.pdf'],
  msWin11Req: ['Windows 11 requirements, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements'],
  msWin11Plan: ['Plan for Windows 11, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/whats-new/windows-11-plan'],
  msWin11AppTest: ['Testing guidelines for Windows 11, Compatibility Cookbook, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/compatibility/windows-11/testing-guidelines'],
  msWaysInstall: ['Ways to install Windows 11, Microsoft Support', 'https://support.microsoft.com/en-us/windows/ways-to-install-windows-11-e0edbbfb-cfc5-4011-868b-2ce77ac7c70e'],
  msPcHealthCheck: ['How to use the PC Health Check app, Microsoft Support', 'https://support.microsoft.com/en-us/windows/how-to-use-the-pc-health-check-app-9c8abd9b-03ba-4e67-81ef-36f37caa7844'],
  msTpm: ['Enable TPM 2.0 on your PC, Microsoft Support', 'https://support.microsoft.com/en-us/windows/enable-tpm-2-0-on-your-pc-1fd5a332-360d-4f46-a1e7-ae6b0c90645c'],
  msBackup: ['Back up and restore with Windows Backup, Microsoft Support', 'https://support.microsoft.com/en-us/windows/back-up-and-restore-with-windows-backup-87a81f8a-78fa-456e-b521-ac0560e32338'],
  msMedia: ['Reinstall Windows with the installation media, Microsoft Support', 'https://support.microsoft.com/en-us/windows/reinstall-windows-with-the-installation-media-d8369486-3e33-7d9c-dccc-859e2b022fc7'],
  msGoBack: ['Go back to the previous version of Windows, Microsoft Support', 'https://support.microsoft.com/en-us/windows/go-back-to-the-previous-version-of-windows-4fdf8a9e-ddc9-4f65-971f-47e7debab6e1'],
  msSafeguard: ['Safeguard holds, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/deployment/update/safeguard-holds'],
  msDefenderUpdates: ['Latest security intelligence updates for Microsoft Defender Antivirus (Manually download the update), Microsoft Security Intelligence', 'https://www.microsoft.com/en-us/wdsi/defenderupdates'],
};

export const primer = {
  title: 'Work in the right order',
  sections: [
    { h: 'The CompTIA troubleshooting methodology', body: '1. Identify the problem. 2. Establish a theory of probable cause (question the obvious); research the knowledge base or internet if applicable. 3. Test the theory to determine the cause. 4. Establish a plan of action to resolve the problem and implement the solution. 5. Verify full system functionality and, if applicable, implement preventive measures. 6. Document findings/lessons learned, actions, and outcomes.' },
    { h: 'Why the order matters', body: 'Changing things before you know the cause wastes time and can add new problems. Test a theory before you fix anything; if the test does not confirm it, form a new theory. Verify the whole system before you close the ticket, then document so the next technician starts ahead.' },
    { h: 'Question the obvious', body: 'Start with the cheapest, most likely cause that matches what changed: a loose cable, the wrong input source, a switch that is off. For a monitor with no signal, Microsoft first checks that the cable is secure and then tries another cable or port.' },
    {"h":"SOHO malware removal (220-1202 2.6)","body":["CompTIA lists ten steps, in this order. Steps 4 to 7 are the cleaning (remediation) work.",[["Step","What you do","Why it sits here"],["1. Investigate and verify malware symptoms","Check the signs: pop-ups, changed browser settings, security alerts, and what Windows Security detected","Symptoms start an investigation; verify the detection before selecting a remedy"],["2. Quarantine the infected system","Disconnect it from the network and shared drives","NIST: an isolated infection is usually contained by disconnecting the host from networks"],["3. Disable System Restore (Windows Home)","Turn off system protection","Restore points taken while infected can bring the malware back"],["4. Remediate infected systems","Start the cleaning phase","Only after the PC is contained"],["5. Update anti-malware software","Obtain current security intelligence on a clean PC and transfer it safely to the isolated PC","Old signatures miss newer malware"],["6. Scan and removal techniques","Scan from safe mode or a preinstallation environment, for example Microsoft Defender Antivirus (offline scan)","Running malware cannot interfere with a scan that runs without loading Windows"],["7. Reimage/reinstall","Rebuild when cleaning fails or the PC cannot be trusted","NIST: for rootkits, backdoors or heavy damage it is often best to rebuild the host"],["8. Schedule scans and run updates","Regular scans, current Windows and definitions","Keep the clean PC clean"],["9. Enable System Restore and create a restore point (Windows Home)","Turn system protection back on and create a point","The first new point is a clean one"],["10. Educate the end user","Explain how it got in and how to avoid it","NIST lists user awareness as part of prevention"]]]},
    {"h":"Restore points around a cleanup","body":"A restore point is a snapshot of system files, installed apps, the registry and system settings; it does not touch personal files. Points taken while the PC was infected can carry the infection back, so CompTIA disables System Restore before cleaning and only turns it back on, with a fresh restore point, after the PC is clean. On Windows, open Create a restore point from Start, select the system drive, then Configure > Turn on system protection, and Create to make a point."},
    {"h":"Change management (220-1202 4.2)","body":["NIST SP 800-128 describes configuration change control as: request the change, record it, decide whether it needs control (some changes are pre-approved), analyze its impact, test it, get approval (usually a change board), implement the approved change, verify it, then close the request. The request records purpose, scope, affected systems, the date and time, and a work plan with a backout (rollback) plan.",[["Change type","Meaning","Process"],["Standard","A routine change approved in advance","Done without a new board review; still documented"],["Normal","Any change that is not pre-approved and not urgent","Analysis, testing, board approval, scheduled window"],["Emergency","A change that cannot wait for the normal process","Made first, then reviewed by the board as soon as practical"]],"Implement only inside an approved maintenance window, never during a change freeze, and do not close the request until you have confirmed the change works."]},
    {"h":"Laser printer imaging stages","body":["HP's imaging stages help locate a fault. Loose toner suggests a bonding problem, but check paper, media settings, the print path and power before condemning the fuser.",[["Stage","What happens (HP service manual)"],["Charging","The primary charging roller gives the drum a uniform negative charge"],["Exposing","The laser discharges the drum where it strikes, making a latent electrostatic image"],["Developing","Negatively charged toner sticks to the discharged drum areas"],["Transferring","The transfer roller charges the back of the paper and attracts toner onto it"],["Separation","The paper separates from the drum; a static eliminator reduces charge on its back"],["Fusing","Heat and pressure bond toner to paper"],["Cleaning","A blade removes toner left on the drum"]],"In V15, objective 220-1201 3.8 asks for laser maintenance (replace toner, apply a maintenance kit, calibrate, clean); knowing the stages tells you which part each task serves."]},
    {"h":"Safe work inside a laptop (220-1202 4.4, 220-1201 1.1)","body":["HP service order: turn the computer off (if you cannot tell whether it is off, asleep or hibernating, turn it on and shut it down through the operating system), unplug the power cord, disconnect external devices, remove the bottom cover noting each screw size and location, then disconnect the battery cable from the system board before you remove internal parts.","Static: a discharge can destroy or silently weaken a part even when you feel nothing. Discharge yourself before you touch an electronic component: wear a wrist strap snug against bare skin with its ground cord connected to the grounding mat or workstation. Keep new parts in their electrostatic-safe containers until you install them and put removed parts into one."]},
    {"h":"Windows 11 in-place upgrade (220-1202 1.2)","body":[[["Requirement","Windows 11 minimum (Microsoft Learn)"],["Processor","1 GHz or faster, two or more cores, on a compatible 64-bit processor or SoC"],["Memory","4 GB or more"],["Storage","64 GB or more"],["System firmware","UEFI, Secure Boot capable"],["TPM","Trusted Platform Module version 2.0"],["Graphics","DirectX 12 or later with a WDDM 2.0 driver"],["Display","High definition (720p), 9 inches or greater, 8 bits per color channel"],["Windows 10 to upgrade from","Version 2004 or later with the September 14, 2021 security update or later"]],"Check eligibility with PC Health Check (Check now). A disabled firmware TPM is turned on in the UEFI settings, where it may be labeled Security Device, Security Device Support, TPM State, AMD fTPM switch, AMD PSP fTPM, Intel PTT or Intel Platform Trust Technology. Back up first, and test the apps you depend on. Windows Update in Settings is the recommended upgrade path. If the offer does not appear on a PC that meets the requirements, find out why before using media: Microsoft may be withholding it with a safeguard hold for a known compatibility issue, and recommends not updating manually until the hold is released. From installation media, Change what to keep > Keep personal files and apps keeps it an in-place upgrade. Afterwards, Settings > System > Recovery > Go back is available for 10 days in most cases."]},
    { h: 'On the exam', body: 'In the V15 objectives CompTIA lists the troubleshooting methodology as job-role knowledge and says the methodology itself will not be tested, so it has no objective number. This lab tags each case with the real objective ids it practices: 220-1201 5.3 (display troubleshooting), 1.1 (mobile part replacement) and 3.8 (printer maintenance); 220-1202 2.6 (malware removal), 4.2 (change management), 4.4 (safety) and 1.2 (installations and upgrades).' },
  ],
  src: ['comptiaA1', 'comptiaA2', 'msMonitor', 'nist83', 'msDefenderOffline', 'msDefenderUpdates', 'msSystemProtection', 'nist128', 'hpImaging', 'hpLaptopService', 'msWin11Req', 'msTpm', 'msWaysInstall', 'msSafeguard', 'msMedia', 'msGoBack'],
};

export const terms = {
  'probable cause': 'The most likely reason for the symptom, based on what you found when identifying the problem.',
  'preventive measures': 'Changes that stop the problem from coming back, such as securing a cable or scheduling an update.',
  quarantine: 'Cutting an infected PC off from the network and shared drives so the malware cannot spread while you clean it.',
  remediate: 'Clean the infected system: update the anti-malware software, scan and remove the malware, and reimage or reinstall if it cannot be cleaned.',
  'restore point': 'A Windows snapshot of system files, installed apps, the registry and system settings that System Restore can roll back to. Personal files are not affected.',
  'preinstallation environment': 'A small separate operating system (such as the Windows Recovery Environment) that starts instead of Windows, so tools can work on the disk while Windows and any malware in it are not running.',
  'offline scan': 'Microsoft Defender Antivirus (offline scan): restarts the PC and scans with the latest definitions without loading Windows.',
  'change request': 'The form that starts a change: what will change, why, which systems are affected, when, who does it, and the backout plan.',
  'change board': 'The group that approves or rejects changes. CompTIA calls this change board approval; NIST SP 800-128 calls the group a configuration control board (CCB).',
  'rollback plan': 'The written steps to undo a change and return the system to its last working state if the change fails. Also called a backout plan.',
  'sandbox testing': 'Trying a change on a separate copy or test system first, so problems show up where they cannot hurt production.',
  'maintenance window': 'An agreed time slot, usually outside business hours, when changes that interrupt service are allowed.',
  'change freeze': 'A period when no changes are allowed, for example during a busy season.',
  'latent image': 'The invisible pattern of charge the laser leaves on the drum before toner makes it visible.',
  fuser: 'The heated part of a laser printer that melts toner into the paper with heat and pressure.',
  ESD: 'Electrostatic discharge: a sudden flow of static electricity that can destroy or weaken electronic parts, often without a spark you can feel.',
  'wrist strap': 'An ESD strap worn snug against bare skin, with a ground cord connected to a grounding mat or workstation.',
  TPM: 'Trusted Platform Module: a security chip or firmware feature that stores keys. Windows 11 requires version 2.0.',
  'Secure Boot': 'A UEFI feature that lets only trusted, signed software start the PC. Windows 11 requires firmware that is Secure Boot capable.',
  'in-place upgrade': 'Upgrading Windows by running setup from inside the current Windows, keeping personal files, apps and settings.',
};

// Grading guards (review VA-order finding 4). The score counts satisfied order
// constraints and correct follow-up answers, so one adjacent swap or one wrong
// answer used to leave 80 to 92 points, a pass. These critical traps cap any run
// with a violated required order, or a follow-up that is unanswered or wrong, at 60.
// Steps the case leaves unconstrained (constraints.before) may still swap places.
function gradeTraps(src, askIds) {
  return [
    { id: 'invalid-order', check: { not: { order: true } }, critical: true, message: 'At least one required step is out of order. Use the feedback to find the violated dependency, then move that step.', why: 'A passing run must satisfy every required ordering dependency; steps left unconstrained by the case may still swap places.', src },
    { id: 'wrong-answer', check: { not: { all: askIds.map((answer) => ({ answer })) } }, critical: true, message: 'At least one question at a step is unanswered or answered wrongly. Open each step that asks a question and use the feedback on your choice.', why: 'The right step done the wrong way still fails the job: a passing run needs every scenario question answered correctly as well as a valid order.', src },
  ];
}

const cases = [{
  id: 'order-01', title: 'No signal after the night cleaning', level: 1,
  scenario: 'Ticket from Jordan at Lakeside Accounting (lakeside-accounting.example): "My desktop turns on but the screen stays black." The monitor power light is on and it shows "No signal". The cleaning crew moved the desks last night. Put the troubleshooting steps in the order you will follow, then answer the question at the theory step.',
  examObjs: { 'aplus-1201': ['5.3'] }, objs: [], minutes: 4,
  items: [
    { id: 'plan', text: 'Establish a plan of action to resolve the problem and implement the solution.', why: 'Only fix what you have proven. A plan made after testing targets the real cause and avoids replacing parts that were fine.' },
    { id: 'identify', text: 'Identify the problem.', why: 'Talk to the user and find out what changed (here, the desks were moved) before touching anything. This is where every ticket starts.' },
    { id: 'document', text: 'Document findings/lessons learned, actions, and outcomes.', why: 'Documenting comes last, after the fix is verified, so the record shows what really worked.' },
    { id: 'test', text: 'Test the theory to determine the cause.', why: 'Testing confirms the cause before you change anything. If the test does not confirm it, go back and form a new theory.' },
    {
      id: 'theory', text: 'Establish a theory of probable cause (question the obvious).', why: 'You need a likely cause before you can test anything. Start with the obvious, cheap checks that fit what changed.',
      ask: {
        q: 'Which theory do you test first for this ticket?',
        choices: [
          'The graphics card failed and must be replaced.',
          'The video cable was knocked loose or the monitor is on the wrong input source.',
          'Windows is corrupted and must be reinstalled.',
          'The power supply is failing.',
        ],
        answer: 'The video cable was knocked loose or the monitor is on the wrong input source.',
        why: 'Question the obvious: the desks were moved, the PC and monitor both have power, and "No signal" means the monitor is not receiving video. A loose cable or wrong input is the most likely cause and takes a minute to check.',
        whyNot: {
          'The graphics card failed and must be replaced.': 'Possible, but expensive and unlikely right after a desk move. Rule out the cable and input first.',
          'Windows is corrupted and must be reinstalled.': 'The monitor says "No signal": it receives no video at all, which points below the operating system. Reinstalling would erase work for nothing.',
          'The power supply is failing.': 'The PC turns on and stays on, so power is not the first suspect for a missing video signal.',
        },
      },
    },
    { id: 'verify', text: 'Verify full system functionality and, if applicable, implement preventive measures.', why: 'Confirm the user can work normally (sign-in, apps, both screens if any) and prevent a repeat, for example by routing the cable where cleaners will not catch it.' },
  ],
  start: ['plan', 'identify', 'document', 'test', 'theory', 'verify'],
  constraints: { order: ['identify', 'theory', 'test', 'plan', 'verify', 'document'] },
  goals: [
    {
      id: 'sequence', text: 'All six steps in CompTIA order', check: { order: true },
      why: 'The methodology moves from facts, to a theory, to proof, to a fix, to verification, to a record. Skipping ahead means fixing things on a guess.',
      expect: 'Identify, theory, test, plan and implement, verify, document.',
      hints: ['Ask yourself what you need to know before each step can happen.', 'You cannot test a theory you have not made, and you cannot fix a cause you have not tested. Documenting is last.', 'Order: Identify the problem; Establish a theory; Test the theory; Establish a plan and implement; Verify full system functionality; Document.'],
      src: ['comptiaA1'],
    },
    {
      id: 'obvious', text: 'Pick the right first theory for this ticket', check: { answer: 'theory' },
      why: 'Question the obvious: start with the cheapest, most likely cause that matches what changed.',
      expect: 'The video cable was knocked loose or the monitor is on the wrong input source.',
      hints: ['What changed last night, and what does "No signal" tell you?', 'The PC and monitor both have power. Think about what connects them.', 'Choose: "The video cable was knocked loose or the monitor is on the wrong input source."'],
      src: ['comptiaA1', 'msMonitor'],
    },
  ],
  traps: [
    { id: 'fix-before-test', check: { before: ['plan', 'test'] }, message: 'You planned and implemented a fix before testing your theory. Replacing parts on a guess costs time and money and can create new problems.', why: 'Test first: a confirmed cause is the only thing worth a plan of action.', src: ['comptiaA1'] },
    { id: 'document-before-verify', check: { before: ['document', 'verify'] }, message: 'You documented before verifying. If the fix did not fully work, the ticket now records a solution that failed.', why: 'Verify full system functionality first, then document the outcome you confirmed.', src: ['comptiaA1'] },
    ...gradeTraps(['comptiaA1'], ['theory']),
  ],
  solution: [
    { do: { move: 'identify', to: 0 }, explain: 'Start by identifying the problem: talk to Jordan, confirm the symptom, and learn that the desks were moved.' },
    { do: { move: 'theory', to: 1 }, explain: 'Next, establish a theory of probable cause. Question the obvious.' },
    { do: { answer: 'theory', choice: 'The video cable was knocked loose or the monitor is on the wrong input source.' }, explain: 'The desk move and "No signal" point to the cable or the input source: the most likely and cheapest cause.' },
    { do: { move: 'test', to: 2 }, explain: 'Test the theory: reseat the video cable at both ends and check the monitor input before changing anything else.' },
    { do: { move: 'plan', to: 3 }, explain: 'With the cause confirmed, plan and implement the fix: secure the cable (or swap it if damaged) and set the right input.' },
    { do: { move: 'verify', to: 4 }, explain: 'Verify Jordan can sign in and work normally, and route the cable so cleaners will not pull it again.' },
    { do: { move: 'document', to: 5 }, explain: 'Document the cause, the fix and the preventive step in the ticket.' },
  ],
  trapDemo: [
    { trap: 'fix-before-test', steps: [] },
    { trap: 'document-before-verify', steps: [{ do: { move: 'document', to: 0 } }] },
  ],
  src: ['comptiaA1', 'msMonitor'],
}, {
  id: 'order-02', title: 'Pop-ups on the bookkeeping PC', level: 1,
  scenario: 'Priya runs a two-person bookkeeping office, Harborview Books (harborview-books.example). Her Windows 11 Home desktop shows pop-up ads, her browser home page changed by itself, and Windows Security warned about a threat it could not remove. The PC is on the office Wi-Fi and shares a USB drive with the other PC. Put CompTIA\'s malware removal steps in order and answer the questions at the quarantine, System Restore and scan steps.',
  examObjs: { 'aplus-1202': ['2.6', '2.4'] }, objs: [], minutes: 6,
  items: [
    { id: 'educate', text: 'Educate the end user.', why: 'Last: once the PC is clean and protected, show Priya how this got in (for example a fake download or a phishing link) so it does not happen again. NIST lists user awareness as part of malware prevention.' },
    {
      id: 'scan', text: 'Scan and remove the malware (scan and removal techniques, for example safe mode or a preinstallation environment).', why: 'The actual removal. It runs after the definitions are fresh, and ideally where the malware is not running, so it cannot hide or fight back.',
      ask: {
        q: 'Windows Security keeps finding the threat but cannot remove it while Windows is running. What do you run?',
        choices: [
          'Another quick scan while signed in normally.',
          'Microsoft Defender Antivirus (offline scan) from Windows Security > Virus & threat protection > Scan options.',
          'System Restore to last month\'s restore point.',
        ],
        answer: 'Microsoft Defender Antivirus (offline scan) from Windows Security > Virus & threat protection > Scan options.',
        why: 'The offline scan restarts the PC and scans with the latest definitions without loading Windows, so malware that is active in normal Windows cannot interfere. Save open files first: it restarts the PC.',
        whyNot: {
          'Another quick scan while signed in normally.': 'The same scan in the same running Windows meets the same active malware. Microsoft offers the offline scan for exactly this case.',
          'System Restore to last month\'s restore point.': 'System Restore is not a reliable malware-removal method. A point may have been taken after infection, may restore infected system components, and does not replace a current scan or a clean rebuild when trust is lost.',
        },
      },
    },
    { id: 'investigate', text: 'Investigate and verify malware symptoms.', why: 'First, investigate the pop-ups, changed home page and Windows Security alert. Check what Windows Security detected and whether an unwanted extension or another cause explains the symptoms before choosing removal steps.' },
    {
      id: 'disableSR', text: 'Disable System Restore (Windows Home).', why: 'Before cleaning, so an infected restore point cannot be used to roll the malware back onto the PC.',
      ask: {
        q: 'Why does CompTIA disable System Restore before the cleanup?',
        choices: [
          'Restore points snapshot system files and the registry, so points taken while infected can bring the malware back.',
          'System Restore deletes personal files during a scan.',
          'Anti-malware software cannot run while System Restore is on.',
        ],
        answer: 'Restore points snapshot system files and the registry, so points taken while infected can bring the malware back.',
        why: 'Microsoft describes a restore point as a snapshot of system files, installed apps, the registry and system settings. If it was taken after the infection, restoring it puts infected files back.',
        whyNot: {
          'System Restore deletes personal files during a scan.': 'Restore points do not affect personal data, and System Restore does nothing during a scan.',
          'Anti-malware software cannot run while System Restore is on.': 'Windows Security runs with System Restore on or off. The reason is the infected restore points, not a conflict.',
        },
      },
    },
    { id: 'schedule', text: 'Schedule scans and run updates.', why: 'After the PC is clean, keep it that way: regular scans and current Windows and anti-malware updates. NIST: anti-malware is effective only when its signatures are up to date.' },
    {
      id: 'quarantine', text: 'Quarantine the infected system.', why: 'Right after you confirm malware, stop it spreading: disconnect the PC from the network and stop sharing drives with it.',
      ask: {
        q: 'How do you quarantine Priya\'s PC?',
        choices: [
          'Leave it on Wi-Fi so it can download updates during the scan.',
          'Disconnect it from the network (Wi-Fi off, Ethernet unplugged) and stop using the shared USB drive with other PCs.',
          'Shut down both PCs in the office and the router.',
          'Delete Priya\'s Downloads folder.',
        ],
        answer: 'Disconnect it from the network (Wi-Fi off, Ethernet unplugged) and stop using the shared USB drive with other PCs.',
        why: 'NIST: an isolated infection is usually contained by disconnecting the affected host from networks. The shared USB drive is a second path to the other PC.',
        whyNot: {
          'Leave it on Wi-Fi so it can download updates during the scan.': 'While it is online, the malware can spread to the other PC and keep talking to the attacker. Containment comes first.',
          'Shut down both PCs in the office and the router.': 'Only one PC shows symptoms. NIST calls breaking connectivity for uninfected hosts the most drastic step, for widespread outbreaks.',
          'Delete Priya\'s Downloads folder.': 'That does not isolate anything, loses her files, and the malware may live elsewhere.',
        },
      },
    },
    { id: 'reimage', text: 'Reimage or reinstall if the malware cannot be removed or the PC cannot be trusted.', why: 'The last resort inside remediation, after scanning. NIST: for rootkits, backdoors or heavy damage it is often best to rebuild the host. Back up Priya\'s data first.' },
    { id: 'updateAM', text: 'Update the anti-malware software.', why: 'Before scanning, update the security intelligence without reconnecting the infected PC to the office network. Download the current Microsoft Defender update package on a clean PC and transfer it with controlled removable media; keep that media away from other PCs after contact with the infected system.' },
    { id: 'enableSR', text: 'Enable System Restore and create a restore point (Windows Home).', why: 'Only after the PC is clean, so the first new restore point is a clean one you can trust.' },
    { id: 'remediate', text: 'Remediate the infected system.', why: 'Remediation is the cleaning phase. In CompTIA\'s list it starts here and covers the next three steps: update anti-malware, scan and remove, reimage if needed.' },
  ],
  start: ['educate', 'scan', 'investigate', 'disableSR', 'schedule', 'quarantine', 'reimage', 'updateAM', 'enableSR', 'remediate'],
  constraints: { order: ['investigate', 'quarantine', 'disableSR', 'remediate', 'updateAM', 'scan', 'reimage', 'schedule', 'enableSR', 'educate'] },
  goals: [
    {
      id: 'sequence', text: 'All ten malware removal steps in CompTIA order', check: { order: true },
      why: 'Each step protects the next: confirm, contain, remove the way back for the malware, clean with fresh tools, then protect and teach.',
      expect: 'Investigate, quarantine, disable System Restore, remediate, update anti-malware, scan and remove, reimage if needed, schedule scans and updates, enable System Restore with a new restore point, educate the user.',
      hints: ['Think of three phases: before cleaning, cleaning, after cleaning.', 'Before: investigate, quarantine, disable System Restore. Cleaning: remediate, update, scan, reimage. After: schedule, enable System Restore, educate.', 'Order: Investigate; Quarantine; Disable System Restore; Remediate; Update anti-malware; Scan and remove; Reimage/reinstall; Schedule scans and run updates; Enable System Restore and create a restore point; Educate the end user.'],
      src: ['comptiaA2'],
    },
    {
      id: 'contain', text: 'Quarantine the right way', check: { answer: 'quarantine' },
      why: 'An infected PC on the network can infect the other PC. Isolate it before you work on it.',
      expect: 'Disconnect it from the network (Wi-Fi off, Ethernet unplugged) and stop using the shared USB drive with other PCs.',
      hints: ['What connects this PC to the other one?', 'Cut the network and the shared drive, nothing more drastic.', 'Choose: "Disconnect it from the network (Wi-Fi off, Ethernet unplugged) and stop using the shared USB drive with other PCs."'],
      src: ['comptiaA2', 'nist83'],
    },
    {
      id: 'restore-points', text: 'Handle restore points safely', check: { all: [{ answer: 'disableSR' }, { before: ['scan', 'enableSR'] }] },
      why: 'Restore points snapshot system files and the registry. Turn System Restore off before cleaning, and create the new point only after the scan, so you never keep an infected one.',
      expect: 'The reason is that infected restore points can bring the malware back, and Enable System Restore comes after the scan.',
      hints: ['What does a restore point contain?', 'System files and the registry, as they were when the point was taken. When was that?', 'Choose the answer about infected restore points, and place Enable System Restore after Scan and remove.'],
      src: ['comptiaA2', 'msSystemProtection'],
    },
    {
      id: 'offline', text: 'Pick the right removal technique', check: { answer: 'scan' },
      why: 'Malware that is running can block its own removal. Scan from outside the running Windows.',
      expect: 'Microsoft Defender Antivirus (offline scan) from Windows Security > Virus & threat protection > Scan options.',
      hints: ['Where can the malware not interfere with the scan?', 'CompTIA names safe mode and a preinstallation environment. Windows Security has a scan that runs without loading Windows.', 'Choose: "Microsoft Defender Antivirus (offline scan) from Windows Security > Virus & threat protection > Scan options."'],
      src: ['comptiaA2', 'msDefenderOffline'],
    },
  ],
  traps: [
    { id: 'clean-while-connected', check: { before: ['scan', 'quarantine'] }, message: 'You scanned and cleaned before quarantining. While you work, the PC stays on Wi-Fi and the shared USB drive, so the malware can reach the other PC and keep talking to the attacker.', why: 'Contain first: disconnect the infected PC from the network and shared drives as soon as you confirm malware.', src: ['comptiaA2', 'nist83'] },
    { id: 'stale-definitions', check: { before: ['scan', 'updateAM'] }, message: 'You scanned before updating the anti-malware software. Old definitions miss newer malware, so the scan can report the PC clean while it is still infected.', why: 'Update the definitions, then scan. Anti-malware is only as good as its latest signatures.', src: ['comptiaA2', 'nist83'] },
    { id: 'infected-restore-point', check: { before: ['enableSR', 'scan'] }, message: 'You turned System Restore back on and created a restore point before removing the malware. That restore point captures the infected system files, and restoring it later brings the malware back.', why: 'Create the new restore point only after the PC is clean.', src: ['comptiaA2', 'msSystemProtection'] },
    ...gradeTraps(['comptiaA2'], ['quarantine', 'disableSR', 'scan']),
  ],
  solution: [
    { do: { move: 'investigate', to: 0 }, explain: 'Investigate the signs and inspect the Windows Security detection to verify what is present.' },
    { do: { move: 'quarantine', to: 1 }, explain: 'Quarantine next, before any cleanup.' },
    { do: { answer: 'quarantine', choice: 'Disconnect it from the network (Wi-Fi off, Ethernet unplugged) and stop using the shared USB drive with other PCs.' }, explain: 'Cut both paths to the other PC: the network and the shared USB drive.' },
    { do: { move: 'disableSR', to: 2 }, explain: 'Disable System Restore on this Windows Home PC.' },
    { do: { answer: 'disableSR', choice: 'Restore points snapshot system files and the registry, so points taken while infected can bring the malware back.' }, explain: 'Infected restore points are the reason.' },
    { do: { move: 'remediate', to: 3 }, explain: 'Remediation starts: the cleaning phase.' },
    { do: { move: 'updateAM', to: 4 }, explain: 'On a clean PC, obtain the current Defender security-intelligence package and transfer it under controlled handling to the isolated PC; then scan.' },
    { do: { move: 'scan', to: 5 }, explain: 'Then scan and remove.' },
    { do: { answer: 'scan', choice: 'Microsoft Defender Antivirus (offline scan) from Windows Security > Virus & threat protection > Scan options.' }, explain: 'The offline scan runs without loading Windows, where the malware cannot interfere.' },
    { do: { move: 'reimage', to: 6 }, explain: 'If the scan cannot clean it, or the PC cannot be trusted, reimage or reinstall after backing up data.' },
    { do: { move: 'schedule', to: 7 }, explain: 'With the PC clean, schedule scans and run updates.' },
    { do: { move: 'enableSR', to: 8 }, explain: 'Turn System Restore back on and create a clean restore point.' },
    { do: { move: 'educate', to: 9 }, explain: 'Finally, show Priya how it got in and how to avoid it next time.' },
  ],
  trapDemo: [
    { trap: 'clean-while-connected', steps: [] },
    { trap: 'stale-definitions', steps: [] },
    { trap: 'infected-restore-point', steps: [{ do: { move: 'enableSR', to: 0 } }] },
  ],
  src: ['comptiaA2', 'nist83', 'msDefenderOffline', 'msDefenderUpdates', 'msSystemProtection'],
}, {
  id: 'order-03', title: 'Patch the scheduling server', level: 2,
  scenario: 'Copperline Dental (copperline-dental.example) runs its patient scheduling app on one Windows Server, FS01. The vendor released an important security update that needs a reboot. There is no sign of an attack, the update is not on the office list of pre-approved changes, and the next approved maintenance window is Saturday at 22:00. The office manager, Dana, asks you to "just install it today". Put the change management steps in order (some steps can swap places) and answer the questions at the request and implementation steps.',
  examObjs: { 'aplus-1202': ['4.2'] }, objs: [], minutes: 7,
  items: [
    {
      id: 'implement', text: 'Implement the change.', why: 'Only after approval, inside the approved window, following the tested plan, with the rollback plan at hand.',
      ask: {
        q: 'When do you install the update on FS01?',
        choices: [
          'Today during clinic hours, because it passed sandbox testing.',
          'In the approved maintenance window, Saturday at 22:00, after telling staff the server will be down.',
          'During the year-end change freeze, because the office is quiet.',
        ],
        answer: 'In the approved maintenance window, Saturday at 22:00, after telling staff the server will be down.',
        why: 'The board approved a date and time. The window keeps the reboot away from patients and staff, and NIST says stakeholders are notified when a change interrupts service.',
        whyNot: {
          'Today during clinic hours, because it passed sandbox testing.': 'A tested change can still fail in production, and the reboot takes scheduling offline while patients are at the desk. Approval covers the window, not "whenever".',
          'During the year-end change freeze, because the office is quiet.': 'A change freeze means no changes are allowed in that period, however quiet it is.',
        },
      },
    },
    { id: 'risk', text: 'Analyze risk and impact: risk level, affected systems, who loses access during the reboot.', why: 'Analysis comes right after the request and before testing: it tells you what to test and what the board must weigh. NIST: analyze the proposed change for its impact before it is approved and implemented.' },
    { id: 'close', text: 'Document the result and close the change request.', why: 'Last. NIST: a change request is not closed until it has been confirmed that the change was deployed without issues.' },
    { id: 'sandbox', text: 'Test the update in a sandbox that matches FS01.', why: 'Testing confirms the impacts found during analysis and reveals new ones, and the results go to the change board. It must happen before approval and long before production.' },
    {
      id: 'request', text: 'Submit a change request: purpose, scope, affected systems, date and time.', why: 'Every controlled change starts as a recorded request. Nothing is analyzed, tested or approved until it exists.',
      ask: {
        q: 'Which change type is this update?',
        choices: [
          'A standard change.',
          'A normal change.',
          'An emergency change.',
        ],
        answer: 'A normal change.',
        why: 'It is not pre-approved and nothing is on fire, so it follows the full process: analysis, testing, board approval and a scheduled window.',
        whyNot: {
          'A standard change.': 'Standard changes are routine changes approved in advance. This update is not on the pre-approved list.',
          'An emergency change.': 'Emergency changes are for problems that cannot wait for the normal process, and they are reviewed afterwards. There is no attack or outage here, and a window is days away.',
        },
      },
    },
    { id: 'verify', text: 'Verify the change: the server is up, the scheduling app works, and staff accept it.', why: 'After implementation: confirm the change works and the users who depend on it accept it (end-user acceptance). If it fails, run the rollback plan.' },
    { id: 'approve', text: 'Get change board approval.', why: 'The board decides with the analysis, test results and rollback plan in hand, so all three come first. Implementation waits for approval.' },
    { id: 'rollback', text: 'Write the rollback plan: how to uninstall the update or restore FS01 from a tested backup.', why: 'The backout plan is part of the change request work plan (NIST Appendix E) and must exist before approval. It can be written before, during or after the risk analysis and testing.' },
  ],
  start: ['implement', 'risk', 'close', 'sandbox', 'request', 'verify', 'approve', 'rollback'],
  constraints: { before: [['request', 'risk'], ['risk', 'sandbox'], ['request', 'rollback'], ['sandbox', 'approve'], ['rollback', 'approve'], ['approve', 'implement'], ['implement', 'verify'], ['verify', 'close']] },
  goals: [
    {
      id: 'sequence', text: 'Every change step in a valid order', check: { order: true },
      why: 'Change management is a gate: request, analysis, testing and a rollback plan come before approval; approval comes before implementation; verification comes before closing.',
      expect: 'Request; then risk analysis and sandbox testing (in that order), with the rollback plan anywhere after the request; then approval, implementation, verification and close.',
      hints: ['What does the change board need to see before it can say yes?', 'The board needs the analysis, the test results and the rollback plan. After approval: implement, verify, close.', 'Order: Request; Risk analysis; Sandbox test; Rollback plan (can sit anywhere between Request and Approval); Approval; Implement; Verify; Close.'],
      src: ['comptiaA2', 'nist128'],
    },
    {
      id: 'ready-for-board', text: 'Bring the board what it needs', check: { all: [{ before: ['risk', 'approve'] }, { before: ['sandbox', 'approve'] }, { before: ['rollback', 'approve'] }] },
      why: 'An approval without analysis, test results or a way back is a guess. NIST: the impacts of the change are presented to the board, and the work plan includes the backout plan.',
      expect: 'Risk analysis, sandbox test and rollback plan all placed before Get change board approval.',
      hints: ['Look at everything above Get change board approval.', 'Three steps feed the board: analysis, testing, rollback plan.', 'Move Analyze risk, Test in a sandbox and Write the rollback plan above Get change board approval.'],
      src: ['comptiaA2', 'nist128'],
    },
    {
      id: 'type', text: 'Classify the change', check: { answer: 'request' },
      why: 'The change type decides how much process the change gets. A routine pre-approved change skips the board; an emergency is reviewed afterwards; everything else is normal.',
      expect: 'A normal change.',
      hints: ['Is it pre-approved? Is anything broken right now?', 'Not pre-approved and not urgent means the full process.', 'Choose: "A normal change."'],
      src: ['comptiaA2', 'nist128'],
    },
    {
      id: 'window', text: 'Implement at the right time', check: { answer: 'implement' },
      why: 'Approval covers a specific date and time. Implementing outside it, or during a freeze, is an unauthorized change even if the patch is good.',
      expect: 'In the approved maintenance window, Saturday at 22:00, after telling staff the server will be down.',
      hints: ['What did the board approve besides the patch itself?', 'A date and time when a reboot hurts nobody.', 'Choose: "In the approved maintenance window, Saturday at 22:00, after telling staff the server will be down."'],
      src: ['comptiaA2', 'nist128'],
    },
  ],
  traps: [
    { id: 'unauthorized-change', check: { before: ['implement', 'approve'] }, critical: true, message: 'You implemented the update before the change board approved it. That is an unauthorized change: if the reboot breaks scheduling, nobody agreed to the risk, the timing or the way back.', why: 'Implement only approved changes. Even a good patch waits for approval and its window.', src: ['comptiaA2', 'nist128'] },
    { id: 'untested-in-production', check: { before: ['implement', 'sandbox'] }, message: 'You installed the update on FS01 before testing it in a sandbox. Production became the test, so a bad update would hit the live scheduling app first.', why: 'Test in a sandbox first. Testing confirms the impacts you analyzed and reveals new ones.', src: ['comptiaA2', 'nist128'] },
    { id: 'closed-unverified', check: { before: ['close', 'verify'] }, message: 'You closed the change request before verifying the change. If the app fails on Monday morning, the record says the change succeeded.', why: 'Verify, get end-user acceptance, then close.', src: ['nist128'] },
    ...gradeTraps(['comptiaA2'], ['request', 'implement']),
  ],
  solution: [
    { do: { move: 'request', to: 0 }, explain: 'Start with a change request that records the purpose, scope, affected systems, date and time.' },
    { do: { answer: 'request', choice: 'A normal change.' }, explain: 'Not pre-approved and not an emergency: a normal change.' },
    { do: { move: 'risk', to: 1 }, explain: 'Analyze risk and impact: FS01 reboots and scheduling is offline during that time.' },
    { do: { move: 'sandbox', to: 2 }, explain: 'Test the update in a sandbox that matches FS01.' },
    { do: { move: 'rollback', to: 3 }, explain: 'Write the rollback plan: uninstall the update or restore FS01 from a tested backup.' },
    { do: { move: 'approve', to: 4 }, explain: 'Present the analysis, test results and rollback plan to the change board for approval.' },
    { do: { move: 'implement', to: 5 }, explain: 'Implement after approval.' },
    { do: { answer: 'implement', choice: 'In the approved maintenance window, Saturday at 22:00, after telling staff the server will be down.' }, explain: 'Use the approved window and warn staff about the downtime.' },
    { do: { move: 'verify', to: 6 }, explain: 'Verify the server and app work and that staff accept the result.' },
    { do: { move: 'close', to: 7 }, explain: 'Document the result and close the change request.' },
  ],
  trapDemo: [
    { trap: 'unauthorized-change', steps: [] },
    { trap: 'untested-in-production', steps: [] },
    { trap: 'closed-unverified', steps: [] },
  ],
  src: ['comptiaA2', 'nist128'],
}, {
  id: 'order-04', title: 'Toner that rubs off', level: 2,
  scenario: 'At Fernhill Veterinary (fernhill-vet.example), Ines reports that pages from the front-desk laser printer look fine but the toner smears off when she rubs them. Before you order a part, put HP\'s seven image-formation processes in order, then answer the questions at the exposing, transferring and fusing stages.',
  examObjs: { 'aplus-1201': ['3.8'] }, objs: [], minutes: 5,
  items: [
    {
      id: 'fusing', text: 'Fusing: make the image permanent.', why: 'After the toner is on the paper, the fuser melts it in. Before that the toner is only held by static and rubs off.',
      ask: {
        q: 'Which imaging process bonds toner to paper, and what should you check before replacing a fuser?',
        choices: [
          'Charging; check the drum, charge roller and contacts first.',
          'Developing; check toner, developer and drum contacts first.',
          'Fusing; check paper, media settings, print path and power.',
          'Cleaning; check the drum blade, waste toner and seals first.',
        ],
        answer: 'Fusing; check paper, media settings, print path and power.',
        why: 'Fusing uses heat and pressure to bond toner. Loose toner points to a bonding problem, but HP lists paper, media-type settings, print-path dirt, power and environment as other possible causes. Diagnose before replacing the fuser.',
        whyNot: {
          'Charging; check the drum, charge roller and contacts first.': 'A charging problem changes what the drum attracts, so it shows up as missing or unwanted toner, not as a full image that rubs off.',
          'Developing; check toner, developer and drum contacts first.': 'Developing puts toner on the drum. Here the image arrives complete; it just is not bonded to the paper.',
          'Cleaning; check the drum blade, waste toner and seals first.': 'Cleaning removes leftover toner from the drum for the next image. It does not decide whether toner bonds to the page.',
        },
      },
    },
    { id: 'charging', text: 'Charging: condition the drum.', why: 'The drum needs a uniform charge before the laser can write on it. HP: the primary charging roller applies a uniform negative charge to the drum surface.' },
    { id: 'cleaning', text: 'Cleaning: get the drum ready for the next image.', why: 'HP lists drum cleaning as the last stage: a blade that always touches the drum wipes off toner that did not transfer and stores it in the waste toner receptacle, so the drum is clean before it is charged again.' },
    {
      id: 'exposing', text: 'Exposing: write the image with the laser.', why: 'The laser can only write on a drum that is already charged, and the toner can only find an image that the laser already wrote.',
      ask: {
        q: 'What does the laser do to the drum?',
        choices: [
          'It discharges the drum wherever the beam strikes, leaving a latent electrostatic image.',
          'It puts a uniform negative charge on the whole drum.',
          'It heats the toner so it sticks to the drum.',
        ],
        answer: 'It discharges the drum wherever the beam strikes, leaving a latent electrostatic image.',
        why: 'HP: the beam sweeps the drum, discharging the negative potential wherever it strikes. That invisible pattern is the latent image.',
        whyNot: {
          'It puts a uniform negative charge on the whole drum.': 'That is the primary charging roller, one stage earlier.',
          'It heats the toner so it sticks to the drum.': 'Nothing heats toner on the drum. Heat is the fuser, and it bonds toner to the paper.',
        },
      },
    },
    { id: 'separation', text: 'Separation: release the paper from the drum.', why: 'After transfer, the paper separates from the drum. HP says a static eliminator reduces charge on the back of the paper before fusing.' },
    {
      id: 'transferring', text: 'Transferring: move the image to the paper.', why: 'The toner image moves from the drum to the paper. Separation and fusing both need the toner already on the paper.',
      ask: {
        q: 'What pulls the toner from the drum onto the paper?',
        choices: [
          'The fuser, by heating the paper.',
          'The transfer roller, by putting a positive charge on the back of the paper.',
          'The cleaning blade, by pushing toner off the drum.',
        ],
        answer: 'The transfer roller, by putting a positive charge on the back of the paper.',
        why: 'HP: the transfer roller applies a positive charge to the back of the media, which attracts the negatively charged toner on the drum.',
        whyNot: {
          'The fuser, by heating the paper.': 'The fuser comes after transfer and only bonds toner that is already on the paper.',
          'The cleaning blade, by pushing toner off the drum.': 'The blade removes toner that was not transferred and sends it to the waste toner receptacle.',
        },
      },
    },
    { id: 'developing', text: 'Developing: apply toner.', why: 'Toner follows the latent image: HP: negatively charged toner is attracted to the discharged (exposed) areas of the drum. Without exposure first there is no image to develop.' },
  ],
  start: ['fusing', 'charging', 'cleaning', 'exposing', 'separation', 'transferring', 'developing'],
  constraints: { order: ['charging', 'exposing', 'developing', 'transferring', 'separation', 'fusing', 'cleaning'] },
  goals: [
    {
      id: 'sequence', text: 'All seven stages in order', check: { order: true },
      why: 'The drum is charged, the laser writes the latent image, toner develops it, toner transfers to paper, paper separates from the drum, heat fuses toner, and the drum is cleaned.',
      expect: 'Charging, exposing, developing, transferring, separation, fusing, cleaning.',
      hints: ['Follow the image from the charged drum to the paper.', 'The paper separates from the drum after transfer and before fusing.', 'Order: Charging; Exposing; Developing; Transferring; Separation; Fusing; Cleaning.'],
      src: ['hpImaging'],
    },
    {
      id: 'laser', text: 'Know what the laser does', check: { answer: 'exposing' },
      why: 'The laser does not print toner. It writes a pattern of charge that the toner follows.',
      expect: 'It discharges the drum wherever the beam strikes, leaving a latent electrostatic image.',
      hints: ['The drum was just charged. What could a beam of light change?', 'Where the beam strikes, the charge goes away.', 'Choose: "It discharges the drum wherever the beam strikes, leaving a latent electrostatic image."'],
      src: ['hpImaging'],
    },
    {
      id: 'transfer', text: 'Know what moves toner to the paper', check: { answer: 'transferring' },
      why: 'Transfer is electrostatic: opposite charges pull the toner onto the page.',
      expect: 'The transfer roller, by putting a positive charge on the back of the paper.',
      hints: ['The toner is negatively charged. What would attract it?', 'A roller behind the paper carries the opposite charge.', 'Choose: "The transfer roller, by putting a positive charge on the back of the paper."'],
      src: ['hpImaging'],
    },
    {
      id: 'symptom', text: 'Match the symptom to the stage', check: { answer: 'fusing' },
      why: 'A process suggests where to investigate; one symptom does not prove one part is defective.',
      expect: 'Fusing; check paper, media settings, print path and power.',
      hints: ['The image reached the paper but does not stay attached. Which process bonds it?', 'Fusing uses heat and pressure. HP also lists paper, settings, print-path dirt and power as possible causes of loose toner.', 'Choose the Fusing answer that checks paper, media settings, print path and power before diagnosing the fuser.'],
      src: ['hpImaging'],
    },
  ],
  traps: [
    { id: 'toner-before-image', check: { before: ['developing', 'exposing'] }, message: 'You placed developing before exposing. Toner is attracted to the areas the laser discharged, so with no latent image yet there is nothing for the toner to follow.', why: 'Charge the drum, write the latent image with the laser, then develop it with toner.', src: ['hpImaging'] },
    { id: 'fuse-before-transfer', check: { before: ['fusing', 'transferring'] }, message: 'You placed fusing before transferring. The fuser bonds toner to the paper, and at that point the toner is still on the drum.', why: 'Transfer moves the toner to the paper; fusing then melts it in.', src: ['hpImaging'] },
    ...gradeTraps(['hpImaging'], ['exposing', 'transferring', 'fusing']),
  ],
  solution: [
    { do: { move: 'charging', to: 0 }, explain: 'Charging: the primary charging roller gives the drum a uniform negative charge.' },
    { do: { move: 'exposing', to: 1 }, explain: 'Exposing: the laser writes the image onto the charged drum.' },
    { do: { answer: 'exposing', choice: 'It discharges the drum wherever the beam strikes, leaving a latent electrostatic image.' }, explain: 'The laser removes charge where the image goes, leaving a latent image.' },
    { do: { move: 'developing', to: 2 }, explain: 'Developing: toner sticks to the discharged areas.' },
    { do: { move: 'transferring', to: 3 }, explain: 'Transferring: the toner image moves onto the paper.' },
    { do: { answer: 'transferring', choice: 'The transfer roller, by putting a positive charge on the back of the paper.' }, explain: 'The transfer roller charge pulls the negative toner onto the paper.' },
    { do: { move: 'separation', to: 4 }, explain: 'Separation: the paper leaves the drum and its back charge is reduced.' },
    { do: { move: 'fusing', to: 5 }, explain: 'Fusing: heat and pressure make the image permanent.' },
    { do: { answer: 'fusing', choice: 'Fusing; check paper, media settings, print path and power.' }, explain: 'Fusing bonds toner; check media and settings, print path and power before testing or replacing the fuser.' },
    { do: { move: 'cleaning', to: 6 }, explain: 'Cleaning: the blade clears leftover toner so the drum is ready for the next image.' },
  ],
  trapDemo: [
    { trap: 'toner-before-image', steps: [{ do: { move: 'developing', to: 0 } }] },
    { trap: 'fuse-before-transfer', steps: [] },
  ],
  src: ['hpImaging'],
}, {
  id: 'order-05', title: 'Swap the laptop SSD safely', level: 2,
  scenario: 'Theo at Ridgeway Surveying (ridgeway-survey.example) needs the SSD in his laptop replaced with a larger one; his data is already backed up. The laptop is on his desk with the lid closed, plugged into its charger and a USB-C dock, and you are not sure whether it is off or asleep. Put the steps in the order you will do them (some can swap places) and answer the questions at the shutdown and grounding steps.',
  examObjs: { 'aplus-1201': ['1.1'], 'aplus-1202': ['4.4'] }, objs: [], minutes: 6,
  items: [
    { id: 'install', text: 'Take the new SSD out of its antistatic bag and install it.', why: 'Keep the new drive in its electrostatic-safe container until you are ready to install it, and install it only after the old one is out.' },
    { id: 'cover', text: 'Remove the bottom cover, noting each screw size and location.', why: 'Only after power and accessories are disconnected. HP: make special note of each screw size and location; a long screw in the wrong hole can damage the board.' },
    {
      id: 'esd', text: 'Put on an ESD wrist strap connected to the grounded mat.', why: 'Discharge yourself before you touch any electronic component. The first one you touch is the battery connector on the system board. It can come any time before that.',
      ask: {
        q: 'How do you wear the wrist strap?',
        choices: [
          'Over your sleeve so it does not pinch.',
          'Snug against bare skin, with the ground cord connected to the grounding mat or workstation.',
          'Loosely, with the ground cord unplugged so you can move around.',
        ],
        answer: 'Snug against bare skin, with the ground cord connected to the grounding mat or workstation.',
        why: 'HP: wear the strap snug against bare skin, and verify the ground cord is connected and fits snugly into the grounding mat or workstation. That gives static a path to ground instead of through the parts.',
        whyNot: {
          'Over your sleeve so it does not pinch.': 'Fabric does not conduct well enough to carry the charge away. The strap must touch bare skin.',
          'Loosely, with the ground cord unplugged so you can move around.': 'With the cord unplugged there is no path to ground, so the strap does nothing.',
        },
      },
    },
    {
      id: 'shutdown', text: 'Shut the laptop down.', why: 'First. HP starts every procedure by turning the computer off; a sleeping laptop is not off.',
      ask: {
        q: 'You cannot tell whether the laptop is off, asleep or hibernating. What do you do?',
        choices: [
          'Assume it is off and start unplugging.',
          'Hold the power button until it turns off.',
          'Turn it on, then shut it down through the operating system.',
        ],
        answer: 'Turn it on, then shut it down through the operating system.',
        why: 'HP: if you are unsure whether the computer is off or in Hibernation or Sleep mode, turn it on, and then shut it down through the operating system. That way you know it is fully off and no work is lost.',
        whyNot: {
          'Assume it is off and start unplugging.': 'A sleeping laptop still has power on its board. You would be working inside a live computer.',
          'Hold the power button until it turns off.': 'A forced power-off skips a clean shutdown and can lose unsaved work. HP says to shut down through the operating system.',
        },
      },
    },
    { id: 'remove', text: 'Remove the old SSD and put it in an electrostatic-safe bag.', why: 'Only with the battery disconnected. HP: place a removed component in an electrostatic-safe container.' },
    { id: 'unplug', text: 'Unplug the AC adapter from the laptop.', why: 'Right after shutdown. HP: disconnect the power by unplugging the power cord before you open anything.' },
    { id: 'reassemble', text: 'Reconnect the battery, replace the cover, then power on and check that the new SSD is detected.', why: 'Last: close up in the reverse order, and only then apply power and test.' },
    { id: 'battery', text: 'Disconnect the battery cable from the system board.', why: 'Inside the laptop the battery still powers the board even with the charger unplugged. HP disconnects it before removing the SSD.' },
    { id: 'dock', text: 'Disconnect the USB-C dock and other external devices.', why: 'After shutdown and before you open the case. HP lists disconnecting all external devices as part of preparing for disassembly.' },
  ],
  start: ['install', 'cover', 'esd', 'shutdown', 'remove', 'unplug', 'reassemble', 'battery', 'dock'],
  constraints: { before: [['shutdown', 'unplug'], ['shutdown', 'dock'], ['unplug', 'cover'], ['dock', 'cover'], ['cover', 'battery'], ['esd', 'battery'], ['battery', 'remove'], ['remove', 'install'], ['install', 'reassemble']] },
  goals: [
    {
      id: 'sequence', text: 'Every step in a safe order', check: { order: true },
      why: 'Power off and disconnected before you open it; grounded before you touch parts; battery disconnected before you pull a part; test only after it is closed up.',
      expect: 'Shut down; unplug the AC adapter and disconnect the dock; remove the cover; ground yourself (any time before the battery cable); disconnect the battery; remove the old SSD; install the new one; reassemble and test.',
      hints: ['Ask at each step: is there still power anywhere, and am I grounded?', 'Outside power goes first (shutdown, adapter, dock), then the cover, then the battery inside, then the part.', 'Order: Shut down; Unplug AC; Disconnect dock; Remove cover; Wrist strap (anywhere before the battery step); Disconnect battery; Remove old SSD; Install new SSD; Reassemble and test.'],
      src: ['hpLaptopService', 'comptiaA2'],
    },
    {
      id: 'power', text: 'No power anywhere when you work inside', check: { all: [{ answer: 'shutdown' }, { before: ['unplug', 'cover'] }, { before: ['battery', 'remove'] }] },
      why: 'Three power sources: the laptop itself (sleep is not off), the AC adapter, and the internal battery. All three are off or disconnected before you touch the SSD.',
      expect: 'Turn it on and shut down through the OS, unplug the AC adapter before removing the cover, and disconnect the battery before removing the SSD.',
      hints: ['Count the ways power can reach the board.', 'Sleep, the charger and the internal battery.', 'Choose "Turn it on, then shut it down through the operating system", place Unplug before Remove the bottom cover, and Disconnect the battery before Remove the old SSD.'],
      src: ['hpLaptopService', 'comptiaA2'],
    },
    {
      id: 'static', text: 'Grounded before you touch parts', check: { all: [{ answer: 'esd' }, { before: ['esd', 'battery'] }] },
      why: 'ESD can destroy a part, or weaken it so it fails weeks later, without a spark you can feel. Discharge yourself before touching any electronic component.',
      expect: 'The strap is snug against bare skin with its ground cord connected, and you put it on before disconnecting the battery cable.',
      hints: ['When do you first touch something on the system board?', 'The battery cable connector is on the system board. Be grounded before it.', 'Choose the bare-skin, cord-connected answer and place the wrist strap step above Disconnect the battery cable.'],
      src: ['hpLaptopService', 'comptiaA2'],
    },
  ],
  traps: [
    { id: 'opened-while-plugged-in', check: { before: ['cover', 'unplug'] }, critical: true, message: 'You opened the laptop while the AC adapter was still plugged in. The board is live: a slip with a screwdriver can short it, and you can be hurt.', why: 'Disconnect power before repairing a PC: unplug the power cord before you open the case.', src: ['hpLaptopService', 'comptiaA2'] },
    { id: 'battery-still-connected', check: { before: ['remove', 'battery'] }, message: 'You removed the SSD with the battery still connected. The internal battery keeps the board powered even with the charger unplugged, so pulling a part can damage it or the board.', why: 'Disconnect the battery cable from the system board before you remove internal parts.', src: ['hpLaptopService'] },
    { id: 'ungrounded', check: { before: ['battery', 'esd'] }, message: 'You touched the battery connector on the system board before grounding yourself. Static from your body can damage the board, often without a spark you feel.', why: 'Put on the wrist strap before you touch any electronic component.', src: ['hpLaptopService', 'comptiaA2'] },
    ...gradeTraps(['hpLaptopService'], ['shutdown', 'esd']),
  ],
  solution: [
    { do: { move: 'shutdown', to: 0 }, explain: 'Shut the laptop down first.' },
    { do: { answer: 'shutdown', choice: 'Turn it on, then shut it down through the operating system.' }, explain: 'You cannot tell if it is asleep, so wake it and shut it down properly.' },
    { do: { move: 'unplug', to: 1 }, explain: 'Unplug the AC adapter.' },
    { do: { move: 'dock', to: 2 }, explain: 'Disconnect the USB-C dock and anything else external.' },
    { do: { move: 'esd', to: 3 }, explain: 'Put on the wrist strap, connected to the grounded mat.' },
    { do: { answer: 'esd', choice: 'Snug against bare skin, with the ground cord connected to the grounding mat or workstation.' }, explain: 'Bare skin and a connected ground cord give static a safe path.' },
    { do: { move: 'cover', to: 4 }, explain: 'Remove the bottom cover and note where each screw goes.' },
    { do: { move: 'battery', to: 5 }, explain: 'Disconnect the battery cable from the system board.' },
    { do: { move: 'remove', to: 6 }, explain: 'Remove the old SSD and bag it.' },
    { do: { move: 'install', to: 7 }, explain: 'Install the new SSD straight from its antistatic bag.' },
    { do: { move: 'reassemble', to: 8 }, explain: 'Reconnect the battery, close it up, power on and confirm the new drive is detected.' },
  ],
  trapDemo: [
    { trap: 'opened-while-plugged-in', steps: [] },
    { trap: 'battery-still-connected', steps: [] },
    { trap: 'ungrounded', steps: [{ do: { move: 'battery', to: 0 } }] },
  ],
  src: ['hpLaptopService', 'comptiaA2'],
}, {
  id: 'order-06', title: 'Windows 11 upgrade at the front desk', level: 3,
  scenario: 'Bayside Dental Lab (bayside-lab.example) still runs Windows 10 Pro on its front-desk PC, RECEPT-02; support for Windows 10 ended on October 14, 2025. The owner, Marisol, wants it upgraded to Windows 11 in place, keeping her files and the case-tracking app. The Windows 11 offer is not showing in Windows Update. IT checked why it is withheld and confirmed that no compatibility safeguard hold applies to this PC; you will run setup from Windows 11 installation media inside Windows 10. Put the steps in order (several can swap places) and answer the questions at the fix, upgrade and verify steps.',
  examObjs: { 'aplus-1202': ['1.2'] }, objs: [], minutes: 8,
  items: [
    {
      id: 'verify', text: 'Verify: sign in, open files, run the case-tracking app, print, and check Device Manager and Windows Update.', why: 'After the upgrade and before you document it. Test the things Marisol depends on while you can still go back.',
      ask: {
        q: 'Three days later the case-tracking app stops working on Windows 11 and the vendor has no fix yet. What is the safe way back?',
        choices: [
          'Settings > System > Recovery > Go back, which keeps personal files and is available for 10 days in most cases.',
          'Wait for the vendor for a month, then decide.',
          'Delete the windows.old folder to free space, then reinstall Windows 10 with Keep nothing.',
        ],
        answer: 'Settings > System > Recovery > Go back, which keeps personal files and is available for 10 days in most cases.',
        why: 'Microsoft: Go back keeps personal files but removes apps and drivers installed after the upgrade and changes to Settings. The window is 10 days in most cases, so test right after upgrading.',
        whyNot: {
          'Wait for the vendor for a month, then decide.': 'Ten days after the upgrade, the previous version of Windows is deleted from the PC and Go back disappears.',
          'Delete the windows.old folder to free space, then reinstall Windows 10 with Keep nothing.': 'Go back needs the windows.old folder, and Keep nothing removes all personal data, settings and apps.',
        },
      },
    },
    { id: 'check', text: 'Run PC Health Check and select Check now.', why: 'Find out whether the PC meets the Windows 11 requirements before you change anything else. Microsoft recommends PC Health Check for Windows 10 Home and Pro.' },
    {
      id: 'upgrade', text: 'Run Windows 11 setup from the installation media inside Windows 10.', why: 'Only after backup, updates, hardware and app checks, and confirmation that no safeguard hold applies. Installation media can bypass a Windows Update hold.',
      ask: {
        q: 'In setup, you select Change what to keep. Which option keeps this an in-place upgrade?',
        choices: [
          'Keep personal files only.',
          'Keep nothing.',
          'Keep personal files and apps.',
        ],
        answer: 'Keep personal files and apps.',
        why: 'Microsoft: Keep personal files and apps preserves personal data, apps and settings. That is the in-place upgrade Marisol asked for.',
        whyNot: {
          'Keep personal files only.': 'This keeps data and settings but removes all apps, including the case-tracking app.',
          'Keep nothing.': 'This removes all personal data, settings and apps: a clean install, not an upgrade.',
        },
      },
    },
    { id: 'apps', text: 'Confirm the case-tracking app and printer drivers support Windows 11, and test them.', why: 'Before the upgrade, any time after the request. Microsoft\'s deployment plan includes testing applications, and its testing guidelines check that an app still works after a Windows 10 to 11 upgrade.' },
    {
      id: 'firmware', text: 'Fix what failed in the check, then run the check again.', why: 'After the check tells you what failed, and before setup. Setup needs every minimum requirement met.',
      ask: {
        q: 'PC Health Check says TPM 2.0 is not enabled. The motherboard manual lists firmware TPM (AMD fTPM). What do you do?',
        choices: [
          'Upgrade anyway: TPM is optional.',
          'Enable AMD fTPM in the UEFI firmware settings, then select Check now again.',
          'Replace the motherboard.',
          'Do a clean install instead; the requirements only apply to upgrades.',
        ],
        answer: 'Enable AMD fTPM in the UEFI firmware settings, then select Check now again.',
        why: 'Microsoft: the TPM option in firmware may be labeled Security Device, TPM State, AMD fTPM switch, AMD PSP fTPM, Intel PTT or Intel Platform Trust Technology. Turn it on, then confirm with Check now (or tpm.msc, Specification Version 2.0).',
        whyNot: {
          'Upgrade anyway: TPM is optional.': 'TPM version 2.0 is on Microsoft\'s list of minimum hardware requirements for Windows 11.',
          'Replace the motherboard.': 'The board already has a firmware TPM; it only needs to be enabled. A new board costs money and time for nothing.',
          'Do a clean install instead; the requirements only apply to upgrades.': 'Microsoft: to install or upgrade to Windows 11, devices must meet the minimum hardware requirements. A clean install would also erase her apps.',
        },
      },
    },
    { id: 'backup', text: 'Back up Marisol\'s files and settings and confirm the backup opens.', why: 'Before the upgrade, any time before setup. An upgrade keeps files when it works; the backup is for when it does not.' },
    { id: 'document', text: 'Document the upgrade, the firmware change and the test results in the ticket.', why: 'Last, after verification, so the record shows what was changed (including the TPM setting) and what was confirmed working.' },
    { id: 'patch', text: 'Install pending Windows 10 updates (version 2004 or later with the September 14, 2021 security update or later is required).', why: 'Before setup, any time. Microsoft: to upgrade directly, Windows 10 must be version 2004 or later and have the September 14, 2021 security update or later.' },
  ],
  start: ['verify', 'check', 'upgrade', 'apps', 'firmware', 'backup', 'document', 'patch'],
  constraints: { before: [['backup', 'upgrade'], ['patch', 'upgrade'], ['check', 'firmware'], ['firmware', 'upgrade'], ['apps', 'upgrade'], ['upgrade', 'verify'], ['verify', 'document']] },
  goals: [
    {
      id: 'sequence', text: 'Every step in a valid order', check: { order: true },
      why: 'Prerequisites (backup, Windows 10 updates, hardware check and fix, app check) in any order, all before setup; then verify; then document.',
      expect: 'Backup, Windows 10 updates, PC Health Check followed by the fix, and the app check, in any order; then setup; then verify; then document.',
      hints: ['Sort the steps into before setup, setup, and after setup.', 'Before: backup, updates, check then fix, apps. After: verify, then document.', 'One valid order: Back up; Install Windows 10 updates; PC Health Check; Fix and recheck; Confirm apps; Run setup; Verify; Document.'],
      src: ['msWin11Req', 'msWin11Plan', 'comptiaA2'],
    },
    {
      id: 'prereqs', text: 'All prerequisites before setup', check: { all: [{ before: ['backup', 'upgrade'] }, { before: ['patch', 'upgrade'] }, { before: ['firmware', 'upgrade'] }, { before: ['apps', 'upgrade'] }] },
      why: 'Back up, check Windows 10 version and updates, hardware, apps and drivers, and rule out a safeguard hold before using media.',
      expect: 'Backup, Windows 10 updates, the TPM fix and the app check all placed before Run Windows 11 setup.',
      hints: ['Look at everything below Run Windows 11 setup.', 'Nothing that prepares the PC belongs after setup.', 'Move Back up, Install pending Windows 10 updates, Fix what failed and Confirm the app above Run Windows 11 setup.'],
      src: ['comptiaA2', 'msWin11Req', 'msWin11Plan', 'msSafeguard'],
    },
    {
      id: 'tpm', text: 'Fix the failed requirement', check: { answer: 'firmware' },
      why: 'Many PCs that fail only on TPM have a firmware TPM that is turned off. Enabling it is a setting, not a part.',
      expect: 'Enable AMD fTPM in the UEFI firmware settings, then select Check now again.',
      hints: ['Is TPM optional for Windows 11?', 'The board has a firmware TPM. Where are firmware settings changed?', 'Choose: "Enable AMD fTPM in the UEFI firmware settings, then select Check now again."'],
      src: ['msTpm', 'msWin11Req'],
    },
    {
      id: 'keep', text: 'Choose the in-place option', check: { answer: 'upgrade' },
      why: 'The choice under Change what to keep decides whether apps and data survive.',
      expect: 'Keep personal files and apps.',
      hints: ['Marisol wants to keep her files and the app.', 'Only one option keeps both.', 'Choose: "Keep personal files and apps."'],
      src: ['msMedia'],
    },
    {
      id: 'goback', text: 'Know the way back', check: { answer: 'verify' },
      why: 'Verification right after the upgrade matters because the easy rollback has a deadline.',
      expect: 'Settings > System > Recovery > Go back, which keeps personal files and is available for 10 days in most cases.',
      hints: ['Windows keeps the old version for a short time after an upgrade.', 'Look in Settings > System > Recovery.', 'Choose the Go back answer.'],
      src: ['msGoBack'],
    },
  ],
  traps: [
    { id: 'upgrade-without-backup', check: { before: ['upgrade', 'backup'] }, critical: true, message: 'You ran setup before backing up. If the upgrade fails or Go back does not work, Marisol\'s files have no copy.', why: 'Back up files and user preferences before any upgrade.', src: ['comptiaA2', 'msWaysInstall'] },
    { id: 'upgrade-before-check', check: { before: ['upgrade', 'check'] }, message: 'You ran setup before checking the hardware requirements. With TPM 2.0 disabled, setup on this PC fails, and you lose the window you scheduled.', why: 'Check eligibility with PC Health Check first, fix what fails, then upgrade.', src: ['msWin11Req', 'msPcHealthCheck'] },
    { id: 'upgrade-before-apps', check: { before: ['upgrade', 'apps'] }, message: 'You upgraded before confirming the case-tracking app and printer drivers support Windows 11. If they do not, the front desk cannot work, and you find out in production.', why: 'Check application and driver support before the upgrade, not after.', src: ['comptiaA2', 'msWin11Plan', 'msWin11AppTest'] },
    ...gradeTraps(['comptiaA2'], ['firmware', 'upgrade', 'verify']),
  ],
  solution: [
    { do: { move: 'backup', to: 0 }, explain: 'Back up Marisol\'s files and settings and confirm the backup opens.' },
    { do: { move: 'patch', to: 1 }, explain: 'Install pending Windows 10 updates so the version and security update requirements are met.' },
    { do: { move: 'check', to: 2 }, explain: 'Run PC Health Check and select Check now.' },
    { do: { move: 'firmware', to: 3 }, explain: 'Fix what failed: the TPM.' },
    { do: { answer: 'firmware', choice: 'Enable AMD fTPM in the UEFI firmware settings, then select Check now again.' }, explain: 'Turn on the firmware TPM and confirm the check passes.' },
    { do: { move: 'apps', to: 4 }, explain: 'Confirm the case-tracking app and printer drivers support Windows 11 and test them.' },
    { do: { move: 'upgrade', to: 5 }, explain: 'With prerequisites done and no safeguard hold, run setup.exe from the installation media inside Windows 10.' },
    { do: { answer: 'upgrade', choice: 'Keep personal files and apps.' }, explain: 'Keep personal files and apps makes it an in-place upgrade.' },
    { do: { move: 'verify', to: 6 }, explain: 'Verify sign-in, files, the app, printing, Device Manager and Windows Update.' },
    { do: { answer: 'verify', choice: 'Settings > System > Recovery > Go back, which keeps personal files and is available for 10 days in most cases.' }, explain: 'If something breaks, Go back is the safe rollback while it is still available.' },
    { do: { move: 'document', to: 7 }, explain: 'Document the upgrade, the TPM change and the test results.' },
  ],
  trapDemo: [
    { trap: 'upgrade-without-backup', steps: [] },
    { trap: 'upgrade-before-check', steps: [{ do: { move: 'check', to: 7 } }] },
    { trap: 'upgrade-before-apps', steps: [] },
  ],
  src: ['comptiaA2', 'msWin11Req', 'msWin11Plan', 'msPcHealthCheck', 'msTpm', 'msSafeguard', 'msMedia', 'msGoBack'],
}];

// Regression demos for the grading guards, replayed by the content gate from the
// start state: every adjacent swap of the reference order that breaks a required
// dependency (invalid-order), and every wrong choice at every follow-up question
// with the order correct (wrong-answer). Each must hit its critical trap.
const placeSteps = (order, answers) => [
  ...order.map((move, to) => ({ do: { move, to } })),
  ...Object.entries(answers).map(([answer, choice]) => ({ do: { answer, choice } })),
];
for (const c of cases) {
  const reference = c.solution.filter((step) => 'move' in step.do).map((step) => step.do.move);
  const required = c.constraints.order ? c.constraints.order.slice(1).map((id, i) => [c.constraints.order[i], id]) : c.constraints.before;
  const asks = c.items.filter((item) => item.ask);
  const answers = Object.fromEntries(asks.map((item) => [item.id, item.ask.answer]));
  reference.slice(1).forEach((id, i) => {
    if (!required.some(([a, b]) => a === reference[i] && b === id)) return;
    const swapped = [...reference];
    [swapped[i], swapped[i + 1]] = [id, reference[i]];
    c.trapDemo.push({ trap: 'invalid-order', steps: placeSteps(swapped, answers) });
  });
  asks.forEach((item) => item.ask.choices.filter((choice) => choice !== item.ask.answer).forEach((choice) =>
    c.trapDemo.push({ trap: 'wrong-answer', steps: placeSteps(reference, { ...answers, [item.id]: choice }) })));
}

export default cases;
