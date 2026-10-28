const DEFAULTS = {
  id: 1,
  maxActiveParcels: 4,
  autoAssignmentRadiusKm: 5,
  priorityDeliveryBufferMin: 15,
  companyName: "FleetX Logistics",
  supportEmail: "",
  operatingCity: "Dhaka, Bangladesh",
  version: 0,
  updatedBy: null,
  updatedAt: null,
};

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

async function getSettings(db) {
  const settings = await db.platformSettings.findUnique({
    where: { id: 1 },
  });

  return settings || { ...DEFAULTS };
}

function validateSettings(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    fail(400, "Invalid settings.");
  }

  function numeric(key, min, max, integer = false) {
    const value = body[key];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (integer && !Number.isInteger(value))
    ) {
      fail(
        400,
        `${key} must be ${
          integer ? "an integer" : "a number"
        } between ${min} and ${max}.`
      );
    }

    return value;
  }

  function text(key, max) {
    if (typeof body[key] !== "string") {
      fail(400, `${key} is required.`);
    }

    const value = body[key].trim();

    if (
      !value ||
      value.length > max ||
      /[\x00-\x1f\x7f]/.test(value)
    ) {
      fail(
        400,
        `${key} must contain 1 to ${max} valid characters.`
      );
    }

    return value;
  }

  const supportEmail = text(
    "supportEmail",
    254
  ).toLowerCase();

  const emailPattern =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

  if (!emailPattern.test(supportEmail)) {
    fail(400, "Enter a valid support email.");
  }

  return {
    version: numeric("version", 0, 2147483646, true),

    data: {
      maxActiveParcels: numeric(
        "maxActiveParcels",
        1,
        100,
        true
      ),

      autoAssignmentRadiusKm: numeric(
        "autoAssignmentRadiusKm",
        0.1,
        100
      ),

      priorityDeliveryBufferMin: numeric(
        "priorityDeliveryBufferMin",
        0,
        1440,
        true
      ),

      companyName: text("companyName", 100),
      supportEmail,
      operatingCity: text("operatingCity", 120),
    },
  };
}

async function saveSettings(db, body, adminId) {
  const { version, data } = validateSettings(body);
  const current = await getSettings(db);

  if (current.version !== version) {
    fail(
      409,
      "Settings were changed by another admin. Reload settings before saving."
    );
  }

  // First save.
  if (version === 0) {
    return db.platformSettings.create({
      data: {
        ...data,
        id: 1,
        version: 1,
        updatedBy: adminId,
      },
    });
  }

  // Update only if the version has not changed.
  const result = await db.platformSettings.updateMany({
    where: {
      id: 1,
      version,
    },
    data: {
      ...data,
      version: { increment: 1 },
      updatedBy: adminId,
    },
  });

  if (result.count !== 1) {
    fail(
      409,
      "Settings changed. Reload settings before saving."
    );
  }

  return getSettings(db);
}

function assignmentTimes(
  priority,
  settings,
  now = Date.now()
) {
  const configured = Number(
    process.env.DELIVERY_SLA_HOURS
  );

  const baseHours =
    Number.isFinite(configured) &&
    configured > 0 &&
    configured <= 8760
      ? configured
      : 24;

  const baseMinutes = baseHours * 60;

  const buffer =
    priority === "EXPRESS"
      ? settings.priorityDeliveryBufferMin
      : 0;

  const minutes = Math.max(1, baseMinutes - buffer);

  return {
    assignedAt: new Date(now),
    dueAt: new Date(now + minutes * 60000),
  };
}

module.exports = {
  getSettings,
  saveSettings,
  validateSettings,
  assignmentTimes,
};