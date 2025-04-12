/**
 * Get user environment information from request
 * @param {Object} request - Express request object
 * @returns {string} Formatted user environment string
 */
const getUserEnvironment = (request) => {
  const userAgent = request.headers["user-agent"];
  const platform = getUserPlatform(userAgent);
  return `${getBrowserInfo(userAgent)} / ${platform}`;
};

/**
 * Get user platform information from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} Platform information
 */
const getUserPlatform = (userAgent) => {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Android")) {
    return `Android ${getMobileVersion(userAgent, "Android")}`;
  }

  if (userAgent.includes("iPad")) {
    return `iPad OS ${getMobileVersion(userAgent, "OS")}`;
  }

  if (userAgent.includes("iPhone")) {
    return `iPhone OS ${getMobileVersion(userAgent, "OS")}`;
  }

  if (userAgent.includes("Linux") && userAgent.includes("KFAPWI")) {
    return "Kindle Fire";
  }

  if (
    userAgent.includes("RIM Tablet") ||
    (userAgent.includes("BB") && userAgent.includes("Mobile"))
  ) {
    return "Black Berry";
  }

  if (userAgent.includes("Windows Phone")) {
    return `Windows Phone ${getMobileVersion(userAgent, "Windows Phone")}`;
  }

  if (userAgent.includes("Mac OS")) {
    return "Mac OS";
  }

  if (
    userAgent.includes("Windows NT 5.1") ||
    userAgent.includes("Windows NT 5.2")
  ) {
    return "Windows XP";
  }

  if (userAgent.includes("Windows NT 6.0")) {
    return "Windows Vista";
  }

  if (userAgent.includes("Windows NT 6.1")) {
    return "Windows 7";
  }

  if (userAgent.includes("Windows NT 6.2")) {
    return "Windows 8";
  }

  if (userAgent.includes("Windows NT 6.3")) {
    return "Windows 8.1";
  }

  if (userAgent.includes("Windows NT 10")) {
    return "Windows 10";
  }

  // Fallback to basic platform
  const isMobile = userAgent.includes("Mobile");
  return `${getBasicPlatform(userAgent)}${isMobile ? " Mobile" : ""}`;
};

/**
 * Get mobile version from user agent
 * @param {string} userAgent - User agent string
 * @param {string} device - Device identifier
 * @returns {string} Version number
 */
const getMobileVersion = (userAgent, device) => {
  const deviceIndex = userAgent.indexOf(device);
  if (deviceIndex === -1) return "";

  let temp = userAgent.substring(deviceIndex + device.length).trimStart();
  let version = "";

  for (const character of temp) {
    const validCharacter = false;
    const test = parseInt(character);

    if (!isNaN(test)) {
      version += character;
      validCharacter = true;
    }

    if (character === "." || character === "_") {
      version += ".";
      validCharacter = true;
    }

    if (!validCharacter) break;
  }

  return version;
};

/**
 * Get basic platform information
 * @param {string} userAgent - User agent string
 * @returns {string} Basic platform name
 */
const getBasicPlatform = (userAgent) => {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  return "Unknown";
};

/**
 * Get browser information
 * @param {string} userAgent - User agent string
 * @returns {string} Browser name and version
 */
const getBrowserInfo = (userAgent) => {
  if (userAgent.includes("Chrome")) {
    const version = userAgent.match(/Chrome\/(\d+\.\d+)/);
    return `Chrome ${version ? version[1] : ""}`;
  }
  if (userAgent.includes("Firefox")) {
    const version = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return `Firefox ${version ? version[1] : ""}`;
  }
  if (userAgent.includes("Safari")) {
    const version = userAgent.match(/Version\/(\d+\.\d+)/);
    return `Safari ${version ? version[1] : ""}`;
  }
  if (userAgent.includes("Edge")) {
    const version = userAgent.match(/Edge\/(\d+\.\d+)/);
    return `Edge ${version ? version[1] : ""}`;
  }
  if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
    return "Internet Explorer";
  }
  return "Unknown Browser";
};

module.exports = {
  getUserEnvironment,
  getUserPlatform,
  getMobileVersion,
  getBasicPlatform,
  getBrowserInfo,
};
