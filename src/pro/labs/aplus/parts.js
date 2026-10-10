// PC Build Bench parts catalog. Names are generic (no brands); each entry is a
// teaching composite whose fields follow the vendor and standards documents
// cited above each list. Opened 2026-10-09.

// CPUs. `tdp` is the rated TDP / processor base power, the figure the PSU
// estimate in pcbuild.js uses. `integratedGraphics: false` models Intel "F"
// parts and AMD parts without graphics: they need a dedicated graphics card.
// - AMD Socket AM5 Chipset (DDR5 only; PCIe 5.0 on select boards):
//   https://www.amd.com/en/products/processors/chipsets/am5.html
// - AMD Socket AM4 Chipsets (DDR4 memory, PCIe 4.0):
//   https://www.amd.com/en/products/processors/chipsets/am4.html
// - Intel, Information About Intel Core Ultra Boxed Desktop Processors (Series 2)
//   (LGA 1851 with Intel 800 Series Chipset, DDR5):
//   https://www.intel.com/content/www/us/en/support/articles/000099656/processors.html
// - Intel, Does My Computer with Intel Core Processor Number Ending with "F" Need
//   a Discrete Graphics Card?:
//   https://www.intel.com/content/www/us/en/support/articles/000058487/processors.html
const cpus = [
  { id: 'cpu-am5-6c-g', name: 'AM5 6-core 65 W CPU with graphics', socket: 'AM5', cores: 6, tdp: 65, integratedGraphics: true, memoryType: 'DDR5' },
  { id: 'cpu-am5-6c-n', name: 'AM5 6-core 65 W CPU, no graphics', socket: 'AM5', cores: 6, tdp: 65, integratedGraphics: false, memoryType: 'DDR5' },
  { id: 'cpu-am5-8c-g', name: 'AM5 8-core 120 W CPU with graphics', socket: 'AM5', cores: 8, tdp: 120, integratedGraphics: true, memoryType: 'DDR5' },
  { id: 'cpu-am5-16c-g', name: 'AM5 16-core 170 W CPU with graphics', socket: 'AM5', cores: 16, tdp: 170, integratedGraphics: true, memoryType: 'DDR5' },
  { id: 'cpu-1851-14c-g', name: 'LGA1851 14-core 65 W CPU with graphics', socket: 'LGA1851', cores: 14, tdp: 65, integratedGraphics: true, memoryType: 'DDR5' },
  { id: 'cpu-1851-20c-f', name: 'LGA1851 20-core 125 W "F" CPU, no graphics', socket: 'LGA1851', cores: 20, tdp: 125, integratedGraphics: false, memoryType: 'DDR5' },
  { id: 'cpu-am4-6c-g', name: 'AM4 6-core 65 W CPU with graphics', socket: 'AM4', cores: 6, tdp: 65, integratedGraphics: true, memoryType: 'DDR4' },
  { id: 'cpu-am4-8c-n', name: 'AM4 8-core 105 W CPU, no graphics', socket: 'AM4', cores: 8, tdp: 105, integratedGraphics: false, memoryType: 'DDR4' },
  { id: 'cpu-laptop-bga', name: 'Laptop 8-core 28 W CPU (soldered, BGA)', socket: 'BGA', cores: 8, tdp: 28, integratedGraphics: true, memoryType: 'DDR5' },
];

// Motherboards. One board takes one DDR generation and one module shape
// (desktop DIMM or laptop SO-DIMM), has a fixed slot count and a maximum
// capacity (Dell KB 000129299). M.2 slots list key, supported lengths and which
// protocols they carry: the key notch decides physical fit, the slot's own spec
// decides SATA or PCIe/NVMe (Dell KB 000144170). AM5 B850/X870-class boards have
// a PCIe 5.0 x4 NVMe link; A620/B840-class boards are PCIe 4.0 (AMD AM5 page).
// - https://www.dell.com/support/kbdoc/en-us/000129299/how-to-upgrade-memory-in-your-computer
// - https://www.dell.com/support/kbdoc/en-us/000144170/how-to-distinguish-the-differences-between-m-2-cards
// - https://www.amd.com/en/products/processors/chipsets/am5.html
// - https://www.corsair.com/us/en/explorer/diy-builder/cases/atx-vs-microatx-vs-mini-itx-whats-the-difference/
const m2 = (pcieGen, sata = false) => ({ key: 'M', sizes: [2242, 2260, 2280], pcieGen, nvme: true, sata });
const boards = [
  { id: 'board-am5-atx', name: 'AM5 ATX board (X870-class)', socket: 'AM5', formFactor: 'ATX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 192, m2Slots: [m2(5), m2(4), m2(4, true)], sataPorts: 4, x16Slots: 2, wifi: 'Wi-Fi 7' },
  { id: 'board-am5-matx', name: 'AM5 Micro-ATX board (B850-class)', socket: 'AM5', formFactor: 'Micro-ATX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 192, m2Slots: [m2(5), m2(4)], sataPorts: 4, x16Slots: 1, wifi: 'Wi-Fi 6E' },
  { id: 'board-am5-matx-basic', name: 'AM5 basic Micro-ATX board (A620-class)', socket: 'AM5', formFactor: 'Micro-ATX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 2, maxMemoryGB: 96, m2Slots: [m2(4)], sataPorts: 4, x16Slots: 1, wifi: null },
  { id: 'board-am5-itx', name: 'AM5 Mini-ITX board (B850-class)', socket: 'AM5', formFactor: 'Mini-ITX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 2, maxMemoryGB: 96, m2Slots: [m2(5), m2(4)], sataPorts: 2, x16Slots: 1, wifi: 'Wi-Fi 7' },
  { id: 'board-1851-atx', name: 'LGA1851 ATX board (Z890-class)', socket: 'LGA1851', formFactor: 'ATX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 192, m2Slots: [m2(5), m2(4), m2(4, true)], sataPorts: 4, x16Slots: 2, wifi: 'Wi-Fi 7' },
  { id: 'board-1851-matx', name: 'LGA1851 Micro-ATX board (B860-class)', socket: 'LGA1851', formFactor: 'Micro-ATX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 192, m2Slots: [m2(4), m2(4)], sataPorts: 4, x16Slots: 1, wifi: 'Wi-Fi 6E' },
  { id: 'board-1851-itx', name: 'LGA1851 Mini-ITX board (B860-class)', socket: 'LGA1851', formFactor: 'Mini-ITX', memoryType: 'DDR5', memoryForm: 'DIMM', dimmSlots: 2, maxMemoryGB: 96, m2Slots: [m2(4)], sataPorts: 2, x16Slots: 1, wifi: 'Wi-Fi 6E' },
  { id: 'board-am4-atx', name: 'AM4 ATX board (B550-class)', socket: 'AM4', formFactor: 'ATX', memoryType: 'DDR4', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 128, m2Slots: [m2(4, true), m2(3, true)], sataPorts: 6, x16Slots: 2, wifi: null },
  { id: 'board-am4-matx', name: 'AM4 Micro-ATX board (B550-class)', socket: 'AM4', formFactor: 'Micro-ATX', memoryType: 'DDR4', memoryForm: 'DIMM', dimmSlots: 4, maxMemoryGB: 128, m2Slots: [m2(4, true)], sataPorts: 4, x16Slots: 1, wifi: null },
  { id: 'board-laptop', name: '14in laptop mainboard (2 DDR5 SO-DIMM slots)', socket: 'BGA', formFactor: 'Laptop', memoryType: 'DDR5', memoryForm: 'SO-DIMM', dimmSlots: 2, maxMemoryGB: 64, m2Slots: [m2(4)], sataPorts: 0, x16Slots: 0, wifi: 'Wi-Fi 6E' },
];

// Memory kits. `count` modules of `moduleGB` each; DDR generations are not
// interchangeable (different notch position and pin layout), and a laptop
// SO-DIMM does not fit a desktop DIMM slot.
// - https://www.dell.com/support/kbdoc/en-us/000129299/how-to-upgrade-memory-in-your-computer
// - https://www.corsair.com/explorer/diy-builder/memory/is-ddr5-backwards-compatible/
const memory = [
  { id: 'ram-d5-16', name: '16 GB DDR5-5600 desktop kit (2 x 8 GB)', type: 'DDR5', form: 'DIMM', count: 2, moduleGB: 8, ecc: false, speedMT: 5600 },
  { id: 'ram-d5-32', name: '32 GB DDR5-6000 desktop kit (2 x 16 GB)', type: 'DDR5', form: 'DIMM', count: 2, moduleGB: 16, ecc: false, speedMT: 6000 },
  { id: 'ram-d5-64', name: '64 GB DDR5-6000 desktop kit (2 x 32 GB)', type: 'DDR5', form: 'DIMM', count: 2, moduleGB: 32, ecc: false, speedMT: 6000 },
  { id: 'ram-d5-128', name: '128 GB DDR5-5600 desktop kit (4 x 32 GB)', type: 'DDR5', form: 'DIMM', count: 4, moduleGB: 32, ecc: false, speedMT: 5600 },
  { id: 'ram-d5-so-16', name: '16 GB DDR5-5600 laptop module (1 x 16 GB SO-DIMM)', type: 'DDR5', form: 'SO-DIMM', count: 1, moduleGB: 16, ecc: false, speedMT: 5600 },
  { id: 'ram-d5-so-32', name: '32 GB DDR5-5600 laptop kit (2 x 16 GB SO-DIMM)', type: 'DDR5', form: 'SO-DIMM', count: 2, moduleGB: 16, ecc: false, speedMT: 5600 },
  { id: 'ram-d4-16', name: '16 GB DDR4-3200 desktop kit (2 x 8 GB)', type: 'DDR4', form: 'DIMM', count: 2, moduleGB: 8, ecc: false, speedMT: 3200 },
  { id: 'ram-d4-32', name: '32 GB DDR4-3200 desktop kit (2 x 16 GB)', type: 'DDR4', form: 'DIMM', count: 2, moduleGB: 16, ecc: false, speedMT: 3200 },
  { id: 'ram-d4-so-16', name: '16 GB DDR4-3200 laptop kit (2 x 8 GB SO-DIMM)', type: 'DDR4', form: 'SO-DIMM', count: 2, moduleGB: 8, ecc: false, speedMT: 3200 },
];

// Graphics cards. Per PCIe CEM 5.1 (as restated in Intel's ATX 3.1-aligned
// design guide 336521 rev 2.1a): the x16 slot supplies up to 75 W, a 2x4
// (8-pin) auxiliary connector 150 W, and a 12V-2x6 connector up to 600 W
// (sense pins signal 150, 300, 450, or 600 W); 12V-2x6 replaces 12VHPWR.
// `adapter` is the included 12V-2x6 adapter and how many
// separate 8-pin leads it needs (one 150 W lead per 150 W of board power).
// - https://cdrdv2-public.intel.com/336521/336521_Rev2p1a.pdf
const gpus = [
  { id: 'gpu-75', name: 'Compact 75 W graphics card (slot powered)', lengthMM: 170, slotWidth: 2, boardPowerW: 75, power: [] },
  { id: 'gpu-150', name: 'Midrange 150 W graphics card', lengthMM: 240, slotWidth: 2, boardPowerW: 150, power: ['8-pin'] },
  { id: 'gpu-220', name: 'Performance 220 W graphics card', lengthMM: 285, slotWidth: 2.5, boardPowerW: 220, power: ['8-pin', '8-pin'] },
  { id: 'gpu-300', name: 'Creator 300 W graphics card', lengthMM: 305, slotWidth: 3, boardPowerW: 300, power: ['12V-2x6'], adapter: { eightPin: 2 } },
  { id: 'gpu-360', name: 'High-end 360 W graphics card', lengthMM: 330, slotWidth: 3, boardPowerW: 360, power: ['12V-2x6'], adapter: { eightPin: 3 } },
  { id: 'gpu-575', name: 'Flagship 575 W graphics card', lengthMM: 355, slotWidth: 3.5, boardPowerW: 575, power: ['12V-2x6'], adapter: { eightPin: 4 } },
];

// Power supplies. ATX and SFX are different mounting sizes (SFX12V is a
// separate form factor in the design guide). The guide recommends a 12V-2x6
// connector on PSUs above 450 W, but ATX 3.1 alone does not guarantee one.
// Each ATX 3.1 PSU in this catalog separately lists a native 12V-2x6 lead;
// check a real PSU's cable and rating against the card's connector needs.
// Efficiency uses the 80 PLUS tier names printed on PSU labels.
// - https://cdrdv2-public.intel.com/336521/336521_Rev2p1a.pdf
const psus = [
  { id: 'psu-300-sfx', name: '300 W SFX power supply', watts: 300, formFactor: 'SFX', atx31: false, native12v2x6: 0, pcie8pin: 0, modular: 'none', efficiency: '80 PLUS Bronze' },
  { id: 'psu-450-sfx', name: '450 W SFX power supply', watts: 450, formFactor: 'SFX', atx31: false, native12v2x6: 0, pcie8pin: 1, modular: 'semi', efficiency: '80 PLUS Gold' },
  { id: 'psu-450-atx', name: '450 W ATX power supply', watts: 450, formFactor: 'ATX', atx31: false, native12v2x6: 0, pcie8pin: 1, modular: 'none', efficiency: '80 PLUS Bronze' },
  { id: 'psu-550-atx', name: '550 W ATX power supply', watts: 550, formFactor: 'ATX', atx31: false, native12v2x6: 0, pcie8pin: 2, modular: 'semi', efficiency: '80 PLUS Bronze' },
  { id: 'psu-650-atx31', name: '650 W ATX 3.1 power supply', watts: 650, formFactor: 'ATX', atx31: true, native12v2x6: 1, pcie8pin: 2, modular: 'full', efficiency: '80 PLUS Gold' },
  { id: 'psu-750-sfx31', name: '750 W SFX ATX 3.1 power supply', watts: 750, formFactor: 'SFX', atx31: true, native12v2x6: 1, pcie8pin: 2, modular: 'full', efficiency: '80 PLUS Gold' },
  { id: 'psu-850-atx31', name: '850 W ATX 3.1 power supply', watts: 850, formFactor: 'ATX', atx31: true, native12v2x6: 1, pcie8pin: 3, modular: 'full', efficiency: '80 PLUS Gold' },
  { id: 'psu-1000-atx31', name: '1000 W ATX 3.1 power supply', watts: 1000, formFactor: 'ATX', atx31: true, native12v2x6: 1, pcie8pin: 4, modular: 'full', efficiency: '80 PLUS Platinum' },
  { id: 'psu-1200-atx31', name: '1200 W ATX 3.1 power supply', watts: 1200, formFactor: 'ATX', atx31: true, native12v2x6: 2, pcie8pin: 4, modular: 'full', efficiency: '80 PLUS Platinum' },
];

// Storage. M.2 2280 = 22 mm wide, 80 mm long. NVMe drives are M-keyed; SATA
// M.2 drives are B+M keyed so they physically fit M slots, but still need a
// slot that carries SATA (Dell KB 000144170).
// - https://www.dell.com/support/kbdoc/en-us/000144170/how-to-distinguish-the-differences-between-m-2-cards
const storage = [
  { id: 'ssd-nvme4-500', name: '500 GB PCIe 4.0 NVMe M.2 2280 SSD', kind: 'nvme', capacityGB: 500, key: 'M', size: 2280, pcieGen: 4 },
  { id: 'ssd-nvme4-1t', name: '1 TB PCIe 4.0 NVMe M.2 2280 SSD', kind: 'nvme', capacityGB: 1000, key: 'M', size: 2280, pcieGen: 4 },
  { id: 'ssd-nvme4-2t', name: '2 TB PCIe 4.0 NVMe M.2 2280 SSD', kind: 'nvme', capacityGB: 2000, key: 'M', size: 2280, pcieGen: 4 },
  { id: 'ssd-nvme5-2t', name: '2 TB PCIe 5.0 NVMe M.2 2280 SSD', kind: 'nvme', capacityGB: 2000, key: 'M', size: 2280, pcieGen: 5 },
  { id: 'ssd-nvme5-4t', name: '4 TB PCIe 5.0 NVMe M.2 2280 SSD', kind: 'nvme', capacityGB: 4000, key: 'M', size: 2280, pcieGen: 5 },
  { id: 'ssd-m2sata-1t', name: '1 TB SATA M.2 2280 SSD (B+M key)', kind: 'm2-sata', capacityGB: 1000, key: 'B+M', size: 2280 },
  { id: 'ssd-sata-1t', name: '1 TB 2.5in SATA SSD', kind: 'sata-2.5', capacityGB: 1000 },
  { id: 'hdd-8t-5400', name: '8 TB 3.5in SATA HDD, 5400 rpm', kind: 'sata-3.5', capacityGB: 8000, rpm: 5400 },
  { id: 'hdd-8t-7200', name: '8 TB 3.5in SATA HDD, 7200 rpm', kind: 'sata-3.5', capacityGB: 8000, rpm: 7200 },
];

// Cases. Board sizes: ATX 305 x 244 mm, Micro-ATX 244 x 244 mm, Mini-ITX
// 170 x 170 mm; a case lists the board sizes it accepts (Corsair). GPU length,
// GPU thickness in slots, cooler height and PSU size are case-spec limits.
// - https://www.corsair.com/us/en/explorer/diy-builder/cases/atx-vs-microatx-vs-mini-itx-whats-the-difference/
// - https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html
const cases = [
  { id: 'case-atx-mid', name: 'ATX mid tower', boardFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLengthMM: 400, maxGpuSlots: 4, psuFormFactors: ['ATX'], bays25: 2, bays35: 2, maxCoolerHeightMM: 170 },
  { id: 'case-atx-storage', name: 'ATX storage tower (8 hard-drive bays)', boardFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'], maxGpuLengthMM: 340, maxGpuSlots: 3, psuFormFactors: ['ATX'], bays25: 2, bays35: 8, maxCoolerHeightMM: 165 },
  { id: 'case-matx', name: 'Micro-ATX compact tower', boardFormFactors: ['Micro-ATX', 'Mini-ITX'], maxGpuLengthMM: 320, maxGpuSlots: 3, psuFormFactors: ['ATX'], bays25: 2, bays35: 1, maxCoolerHeightMM: 160 },
  { id: 'case-matx-nas', name: 'Micro-ATX NAS case (4 hot-swap bays)', boardFormFactors: ['Micro-ATX', 'Mini-ITX'], maxGpuLengthMM: 250, maxGpuSlots: 2, psuFormFactors: ['ATX', 'SFX'], bays25: 2, bays35: 4, maxCoolerHeightMM: 130 },
  { id: 'case-itx-slim', name: 'Mini-ITX slim desktop', boardFormFactors: ['Mini-ITX'], maxGpuLengthMM: 180, maxGpuSlots: 2, psuFormFactors: ['SFX'], bays25: 1, bays35: 0, maxCoolerHeightMM: 58 },
  { id: 'case-itx-tower', name: 'Mini-ITX small tower', boardFormFactors: ['Mini-ITX'], maxGpuLengthMM: 335, maxGpuSlots: 3, psuFormFactors: ['SFX'], bays25: 2, bays35: 0, maxCoolerHeightMM: 70 },
];

// CPU coolers. A cooler must ship a mounting kit for the socket, be rated for
// the CPU's heat load, and fit under the case side panel (Intel build guide:
// "compatible with your CPU and sized to fit your build").
// - https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html
const coolers = [
  { id: 'cooler-slim-65', name: 'Slim low-profile cooler, 47 mm, 65 W', sockets: ['AM5', 'AM4', 'LGA1851'], tdpRatingW: 65, heightMM: 47 },
  { id: 'cooler-low-95', name: 'Low-profile cooler, 68 mm, 95 W', sockets: ['AM5', 'AM4', 'LGA1851'], tdpRatingW: 95, heightMM: 68 },
  { id: 'cooler-1851-low', name: 'LGA1851-only low-profile cooler, 55 mm, 65 W', sockets: ['LGA1851'], tdpRatingW: 65, heightMM: 55 },
  { id: 'cooler-tower-180', name: 'Tower air cooler, 155 mm, 180 W', sockets: ['AM5', 'AM4', 'LGA1851'], tdpRatingW: 180, heightMM: 155 },
  { id: 'cooler-tower-250', name: 'Dual-tower air cooler, 165 mm, 250 W', sockets: ['AM5', 'AM4', 'LGA1851'], tdpRatingW: 250, heightMM: 165 },
];

export const parts = { cpus, boards, memory, gpus, psus, storage, cases, coolers };

export function findPart(category, id) {
  return parts[category]?.find((part) => part.id === id) ?? null;
}
