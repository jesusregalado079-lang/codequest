// HP specifications are Jesse's report in the approved Claude review, 2026-10-16.
// Suggested allocation is a local planning choice; requirements are linked below.
export const hpSetup = {
  title: 'HP setup checklist: read before starting Wazuh or Atomic Red Team',
  intro: 'Dedicated HP, separate from the boys’ PC. Reported hardware: 11th-generation Intel Core, 4 physical cores / 8 logical processors, 15.6 GB RAM, Windows 11 Home 64-bit, Ubuntu under WSL2. Recheck the installed Ubuntu version before setup; the transcript’s version string is not independently verified. These instructions are saved here for later; no machine settings have been changed.',
  steps: [
    'Before setup, remove personal accounts and data from the attack environment and prepare a tested backup/recovery path. Use disposable, recoverable targets when a test can alter the system.',
    'Microsoft documents WSL2’s default memory cap as half of Windows RAM. Suggested HP allocation: 10 GB, leaving roughly 5.6 GB for Windows based on your reported hardware. Set memory=10GB under [wsl2] in %UserProfile%\\.wslconfig, or use WSL Settings. Preserve existing settings and make sure at least 4 logical processors remain available to WSL. Close heavy apps and other lab stacks.',
    'Save your WSL work, then run wsl --shutdown from Windows PowerShell to apply the settings. Restart WSL/Docker and verify actual available resources. Wazuh’s single-node Docker documentation requires at least 4 cores, 8 GB RAM and 50 GB storage for images/data. Free storage on this HP is UNKNOWN until checked; do not assume hardware compatibility proves it has room.',
    'Use Wazuh’s official single-node Docker/Compose deployment with WSL2, rather than assuming the native installer supports your Ubuntu version. Check the Docker runtime’s own resources and verify the current Wazuh prerequisites again when you begin.',
    'In the WSL2 Docker-host environment, run sudo sysctl -w vm.max_map_count=262144. Confirm with sysctl vm.max_map_count before deployment. Wazuh documents that this setting is lost on restart; reapply it after restarting WSL, or follow its persistent sysctl instructions and verify they apply in your Docker host.',
    'Install the Wazuh agent and Sysmon on the HP Windows endpoint. Connect the agent to the manager in WSL2 and verify Sysmon events arrive before any simulation. Restrict lab service exposure and use localhost bindings for the deliberately vulnerable web/API apps.',
    'Read the selected Atomic test, prerequisites and cleanup. Run one test at a time on the prepared HP Windows lab endpoint through Invoke-AtomicRedTeam, with Defender enabled. Record the technique, time, Defender block or execution result, and matching Wazuh evidence. Run cleanup afterward and confirm the state is restored. Do not run Atomic tests on the Mac or the boys’ PC.',
    'When finished, stop the lab Compose stack while keeping evidence volumes you still need. Save WSL work before running wsl --shutdown in Windows to release its resources. Start lightweight targets separately rather than running all labs together.',
  ],
  sources: [
    { label: 'Microsoft: WSL configuration and memory settings', url: 'https://learn.microsoft.com/en-us/windows/wsl/wsl-config' },
    { label: 'Wazuh: Docker prerequisites and deployment', url: 'https://documentation.wazuh.com/current/deployment-options/docker/wazuh-container.html' },
    { label: 'Atomic Red Team: getting started and cleanup', url: 'https://github.com/redcanaryco/atomic-red-team/wiki/Getting-Started' },
    { label: 'Invoke-AtomicRedTeam runner', url: 'https://github.com/redcanaryco/invoke-atomicredteam' },
  ],
};
