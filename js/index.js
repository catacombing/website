// Update/disable checkboxes when DE is changed.
function deChanged(input) {
  // Clear all checkboxes when DE is changed.
  document.querySelectorAll('input[type=checkbox]').forEach((input) => {
    input.disabled = false;
    input.checked = false;
  });

  // Set checkboxes to match the DE's default package list.
  switch (input.value) {
  case 'catacomb':
    enableCheckboxes([
      'comp-catacomb', 'osk-squeekboard', 'launcher-tzompantli', 'panel-epitaph', 'misc-swayidle',
    ], true);
    enableCheckboxes([
      'wp-tabula', 'browser-kumo', 'terminal-alacritty', 'clock-catacomb', 'camera-megapixels',
      'misc-grim', 'misc-wfrecorder',
    ], false);
    break;
  case 'sxmo':
    enableCheckboxes([
      'comp-sway', 'osk-wvkbd', 'launcher-bemenu', 'wp-swaybg', 'terminal-foot', 'img-imv',
      'misc-swayidle', 'misc-grim', 'misc-mako',
    ], true);
    enableCheckboxes(['camera-megapixels', 'editor-vim'], false);
    break;
  case 'phosh':
    enableCheckboxes(['osk-squeekboard'], true);
    enableCheckboxes([
      'browser-ff-mobile', 'terminal-gnome', 'editor-gnome', 'clock-gnome', 'calls-gnome',
      'sms-chatty', 'camera-megapixels', 'music-lollypop', 'img-eog', 'fm-portfolio',
      'maps-gnome',
    ], false);
    break;
  case 'plasma':
    enableCheckboxes(['osk-maliit'], true);
    enableCheckboxes([
      'browser-angelfish', 'terminal-qmlkonsole', 'editor-maui', 'clock-kclock', 'calls-plasma',
      'sms-spacebar', 'camera-megapixels', 'music-elisa', 'img-koko', 'fm-indexfm',
    ], false);
    break;
  case 'none':
  default:
    break;
  }
}

// Check a list of checkboxes, optionally marking them disabled.
function enableCheckboxes(checkboxes, disabled) {
  for (let i = 0; i < checkboxes.length; i++) {
    const checkbox = document.getElementById(checkboxes[i]);
    checkbox.disabled = disabled;
    checkbox.checked = true;
  }
}

// Convert current selection to list of packages
function selected_packages() {
  var packages = [];

  // Add DE packages which cannot be freely selected.
  switch (document.querySelector('input[name=de]:checked').value) {
  case 'catacomb':
    packages.push('catacomb-meta', 'tremor', 'tinydm');
    break;
  case 'sxmo':
    packages.push('danctnix-sxmo-ui-meta', 'sxmo-utils-sway', 'glibc-locales');
    break;
  case 'phosh':
    packages.push(
      'danctnix-phosh-ui-meta', 'danctnix-tweaks-app-phosh', 'cups', 'cups-filters',
      'evince-mobile', 'geary', 'ghostscript', 'glibc-locales', 'gnome-calculator',
      'gnome-calendar-mobile', 'gnome-contacts-mobile', 'gnome-sound-recorder', 'gnome-usage',
      'gnome-weather', 'gsfonts', 'gst-plugins-bad', 'gst-plugins-good', 'gtk3-mobile', 'mesa',
      'mmsd-tng', 'networkmanager-openvpn', 'noto-fonts-emoji', 'power-profiles-daemon',
      'xdg-user-dirs',
    );
    break;
  case 'plasma':
    packages.push(
      'buho', 'calindori', 'cups', 'cups-filters', 'danctnix-pm-ui-meta', 'discover',
      'ghostscript', 'glibc-locales', 'gsfonts', 'gst-plugins-bad', 'gst-plugins-good',
      'kaccounts-providers', 'kalk', 'kweather', 'mesa', 'modemmanager', 'networkmanager-openvpn',
      'noto-fonts', 'noto-fonts-cjk', 'noto-fonts-emoji', 'packagekit-qt6', 'plasma',
      'plasma-mobile-autologin', 'plasma-mobile-sounds', 'plasma-phonebook', 'plasma-settings',
      'xdg-desktop-portal-kde', 'xdg-user-dirs',
    );
    break;
  case 'none':
  default:
    break;
  }

  // Add all the checkboxed packages.
  document.querySelectorAll('input[type=checkbox]:checked').forEach((input) => {
    packages = packages.concat(input.value.split(' '));
  });

  // Add audio backend packages.
  switch (document.querySelector('input[name=de]:checked').value) {
  case 'pulseaudio':
    packages.push('pulseaudio');
    break;
  case 'pipewire':
  default:
    packages.push('pipewire-pulse');
    break;
  }

  // Return deduplicated list of packages.
  return [...new Set(packages)].sort();
}

// Get current status of a request.
async function get_status(device, md5sum) {
  const response = await fetch(`https://catacombing.org/isotopia/requests/${device}/${md5sum}/status`);
  if (response.status == 200) {
    const status = await response.json();
    return status;
  } else if (response.status == 404) {
    return undefined;
  } else {
    throw new Error(`Status request failed: ${response.status}`);
  }
}

// Check status of a request and show the corresponding popup.
async function checkRequestStatus(device, md5sum) {
  const status = await get_status(device, md5sum);

  // Open correct popup based on current request state.
  switch (status) {
  case 'done':
    document.getElementById('download-popup').style.display = 'flex';
    break;
  case 'pending':
  case 'building':
  case 'writing':
    document.getElementById('pending-popup').style.display = 'flex';

    // Reload page every 30 seconds.
    setTimeout(() => window.location.reload(), 30000);
    break;
  default:
    document.getElementById('start-build-popup').style.display = 'flex';
    break;
  }
}

// Submit button handler.
async function submit() {
  // Check if request already exists.
  const device = document.querySelector('input[name=device]:checked').value;
  const packages = selected_packages();
  const md5sum = hex_md5(packages.join(' '));

  // Redirect to show popups.
  const status = await get_status(device, md5sum);
  switch (status) {
  case 'done':
  case 'pending':
  case 'building':
  case 'writing':
    // Redirect to ensure query params are set.
    const params = new URLSearchParams();
    params.set('device', device);
    params.set('md5sum', md5sum);
    window.location.search = params;
    break;
  default:
    // Show build popup without refresh, so checkboxes don't get reset.
    document.getElementById('start-build-popup').style.display = 'flex';
    break;
  }
}

// Popup cancel button handler.
function cancelPopup() {
  window.location.search = '';
}

// Build request confirmation button handler.
async function confirmBuild() {
  // Request a new build.
  const device = document.querySelector('input[name=device]:checked').value;
  const packages = selected_packages();
  const response = await fetch( 'https://catacombing.org/isotopia/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packages,
      device,
    }),
  });

  // Show error popup if request failed.
  if (response.status != 200) {
    window.location.search = '?error=true';
    return;
  }

  // Use server's md5sum just to be safe.
  const request = await response.json();
  const params = new URLSearchParams();
  params.set('device', device);
  params.set('md5sum', request.md5sum);
  window.location.search = params;
}

// Download the image.
async function confirmDownload() {
  const params = new URLSearchParams(window.location.search);
  const device = params.get('device');
  const md5sum = params.get('md5sum');
  window.location = `https://catacombing.org/isotopia/requests/${device}/${md5sum}/image`;
}

// Show status popup based on query parameters.
const params = new URLSearchParams(window.location.search);
const query_device = params.get('device');
const query_md5sum = params.get('md5sum');
const error = params.get('error');
if (error === 'true') {
  document.getElementById('error-popup').style.display = 'flex';
} else if (query_md5sum && query_device) {
  checkRequestStatus(query_device, query_md5sum);
}
