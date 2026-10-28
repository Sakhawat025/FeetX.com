const prisma = require("../config/prisma");

const {
  getSettings,
  saveSettings,
} = require("../services/platformSettingsService");

async function authorize(db, req) {
  const admin = await db.user.findFirst({
    where: {
      id: req.user.id,
      role: "ADMIN",
      status: true,
    },
    select: {
      id: true,
    },
  });

  if (!admin) {
    throw Object.assign(
      new Error("Active administrator access required."),
      { status: 403 }
    );
  }
}

function errorResponse(res, error) {
  if (["P2034", "P2002"].includes(error.code)) {
    return res.status(409).json({
      message:
        "Settings changed concurrently. Reload settings before saving.",
    });
  }

  if (!error.status) {
    console.error("Admin settings:", error);
  }

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Unable to load or save settings. Check the database migration and retry.",
  });
}

exports.getSettings = async (req, res) => {
  try {
    await authorize(prisma, req);

    res.set("Cache-Control", "no-store");
    res.json(await getSettings(prisma));
  } catch (error) {
    errorResponse(res, error);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        await authorize(tx, req);

        return saveSettings(
          tx,
          req.body,
          req.user.id
        );
      },
      {
        isolationLevel: "Serializable",
        timeout: 10000,
      }
    );

    res.set("Cache-Control", "no-store");
    res.json(result);
  } catch (error) {
    errorResponse(res, error);
  }
};