#!/bin/sh
set -eu

repo="v0l/agentee"
dir="${AGENTEE_INSTALL_DIR:-$HOME/.local/bin}"
version="${AGENTEE_VERSION:-latest}"

fail() {
  echo "agentee: $*" >&2
  exit 1
}

case "$(uname -s)" in
  Linux) os="unknown-linux-gnu" ;;
  Darwin) os="apple-darwin" ;;
  *) fail "no build for $(uname -s); use Windows PowerShell (irm https://agentee.sh/install.ps1 | iex) or cargo install --git https://github.com/$repo agentee" ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) arch="x86_64" ;;
  arm64 | aarch64) arch="aarch64" ;;
  *) fail "no build for $(uname -m); build from source: cargo install --git https://github.com/$repo agentee" ;;
esac

if [ "$os" = "apple-darwin" ] && [ "$arch" = "x86_64" ] && [ "$(sysctl -in sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
  arch="aarch64"
fi

target="$arch-$os"
asset="agentee-$target.tar.gz"
if [ "$version" = "latest" ]; then
  url="https://github.com/$repo/releases/latest/download/$asset"
else
  url="https://github.com/$repo/releases/download/$version/$asset"
fi

if command -v curl >/dev/null 2>&1; then
  get() { curl -fsSL "$1" -o "$2"; }
elif command -v wget >/dev/null 2>&1; then
  get() { wget -qO "$2" "$1"; }
else
  fail "needs curl or wget"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "agentee: downloading $asset ($version)"
get "$url" "$tmp/$asset" || fail "download failed: $url"

if get "$url.sha256" "$tmp/$asset.sha256" 2>/dev/null; then
  want="$(cut -d ' ' -f 1 "$tmp/$asset.sha256")"
  if command -v sha256sum >/dev/null 2>&1; then
    have="$(sha256sum "$tmp/$asset" | cut -d ' ' -f 1)"
  else
    have="$(shasum -a 256 "$tmp/$asset" | cut -d ' ' -f 1)"
  fi
  [ "$want" = "$have" ] || fail "checksum mismatch for $asset"
fi

tar -xzf "$tmp/$asset" -C "$tmp"
mkdir -p "$dir"
install -m 755 "$tmp/agentee-$target/agentee" "$dir/agentee"

echo "agentee: installed $("$dir/agentee" --version) to $dir/agentee"
case ":$PATH:" in
  *":$dir:"*) ;;
  *) echo "agentee: add $dir to your PATH, e.g. echo 'export PATH=\"$dir:\$PATH\"' >> ~/.profile" ;;
esac
echo "agentee: give your agent the skill with: npx skills add https://agentee.sh"
