export interface Platform {
  slug: string;
  name: string;
  summary: string;
  builds: { label: string; asset: string }[];
  install: string;
  needs: string[];
  libraries: string;
  librariesCode: string;
  notes: string[];
}

export const REPO = 'https://github.com/v0l/agentee';
export const SITE = 'https://agentee.sh';

export const asset = (target: string) =>
  `agentee-${target}.${target.includes('windows') ? 'zip' : 'tar.gz'}`;

export const latestUrl = (file: string) => `${REPO}/releases/latest/download/${file}`;

export const PLATFORMS: Platform[] = [
  {
    slug: 'linux',
    name: 'Linux',
    summary: 'Install agentee on Linux for x86_64 or arm64 with one command, add the KiCad libraries it imports parts from, and check that the GPU solvers can see your graphics card.',
    builds: [
      { label: 'x86_64', asset: 'x86_64-unknown-linux-gnu' },
      { label: 'arm64', asset: 'aarch64-unknown-linux-gnu' },
    ],
    install: 'curl -fsSL https://agentee.sh/install.sh | sh',
    needs: [
      'glibc 2.35 or newer: Ubuntu 22.04, Debian 12, Fedora 36 and later.',
      'A Vulkan driver for the field solver, FDTD and thermal sims: Mesa for AMD and Intel, the proprietary driver for NVIDIA. The 2D field solver falls back to the CPU without one.',
      'X11 or Wayland for <code>agentee view</code>. Everything else, rendering to PNG included, runs headless over SSH.',
    ],
    libraries: 'Imports read the KiCad symbol and footprint libraries from <code>/usr/share/kicad</code>. On Debian and Ubuntu they are packaged on their own, so KiCad itself is not needed:',
    librariesCode: 'sudo apt install kicad-symbols kicad-footprints kicad-packages3d',
    notes: [
      'The script puts the binary in <code>~/.local/bin</code>. Set <code>AGENTEE_INSTALL_DIR</code> to put it somewhere else.',
      'Libraries anywhere else are found through <code>KICAD9_SYMBOL_DIR</code> and <code>KICAD9_FOOTPRINT_DIR</code>.',
    ],
  },
  {
    slug: 'macos',
    name: 'macOS',
    summary: 'Install agentee on Apple silicon or Intel Macs, point it at the libraries inside KiCad.app, and run the GPU solvers on Metal.',
    builds: [
      { label: 'Apple silicon', asset: 'aarch64-apple-darwin' },
      { label: 'Intel', asset: 'x86_64-apple-darwin' },
    ],
    install: 'curl -fsSL https://agentee.sh/install.sh | sh',
    needs: [
      'macOS 11 or newer.',
      'The field solver, FDTD and thermal sims run on Metal, on any Mac that runs macOS 11.',
    ],
    libraries: 'Imports read the KiCad libraries from inside the app bundle, so installing KiCad is enough:',
    librariesCode: 'brew install --cask kicad',
    notes: [
      'The binary is not notarised. The install script downloads it with curl, which leaves no quarantine flag. If you download the archive in a browser instead, clear the flag once with <code>xattr -d com.apple.quarantine agentee</code>.',
      'The libraries are found under <code>/Applications/KiCad/KiCad.app/Contents/SharedSupport</code>. Anywhere else, set <code>KICAD9_SYMBOL_DIR</code> and <code>KICAD9_FOOTPRINT_DIR</code>.',
    ],
  },
  {
    slug: 'windows',
    name: 'Windows',
    summary: 'Install agentee on Windows from PowerShell, tell it where KiCad keeps its libraries, and run the GPU solvers on DirectX 12 or Vulkan.',
    builds: [{ label: 'x86_64', asset: 'x86_64-pc-windows-msvc' }],
    install: 'irm https://agentee.sh/install.ps1 | iex',
    needs: [
      'Windows 10 or 11, x86_64.',
      'A DirectX 12 or Vulkan capable GPU driver for the field solver, FDTD and thermal sims.',
    ],
    libraries: 'agentee does not look in Program Files on its own. Install KiCad, then point it at the libraries once:',
    librariesCode:
      'setx KICAD9_SYMBOL_DIR "C:\\Program Files\\KiCad\\9.0\\share\\kicad\\symbols"\nsetx KICAD9_FOOTPRINT_DIR "C:\\Program Files\\KiCad\\9.0\\share\\kicad\\footprints"\nsetx KICAD9_3DMODEL_DIR "C:\\Program Files\\KiCad\\9.0\\share\\kicad\\3dmodels"',
    notes: [
      'The script puts <code>agentee.exe</code> in <code>%LOCALAPPDATA%\\agentee\\bin</code> and adds it to your user <code>PATH</code>. Open a new terminal afterwards.',
      '<code>KICAD9_3DMODEL_DIR</code> is for the 3D view and the STEP export. Without it, <code>agentee models</code> downloads the models a project uses.',
    ],
  },
];
