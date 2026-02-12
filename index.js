const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ATTENDANCE_CHANNEL = "attendance";
const attendanceMap = new Map();
const dailyAttendance = {};

function today() {
  return new Date().toISOString().split("T")[0];
}

function format(ms) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

client.once("ready", () => {
  console.log("✅ Attendance Bot Online");
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.name !== ATTENDANCE_CHANNEL) return;

  const text = msg.content.toLowerCase();
  const id = msg.author.id;

  if (text === "online") {
    if (attendanceMap.has(id))
      return msg.reply("⚠️ Tum already online ho");

    attendanceMap.set(id, new Date());
    return msg.reply("✅ Online started");
  }

  if (text === "offline") {
    if (!attendanceMap.has(id))
      return msg.reply("❌ Pehle online likho");

    const start = attendanceMap.get(id);
    const diff = Date.now() - start;
    attendanceMap.delete(id);

    const d = today();
    if (!dailyAttendance[d]) dailyAttendance[d] = {};
    if (!dailyAttendance[d][id]) dailyAttendance[d][id] = 0;
    dailyAttendance[d][id] += diff;

    return msg.reply(`⛔ Time added: **${format(diff)}**`);
  }

  if (text === "mytime") {
    const t = dailyAttendance[today()]?.[id] || 0;
    return msg.reply(`🕒 Aaj ka total: **${format(t)}**`);
  }

  if (text === "leaderboard") {
    const data = dailyAttendance[today()];
    if (!data) return msg.reply("❌ No data");

    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    let out = "🏆 **Leaderboard**\n";
    for (let i = 0; i < sorted.length; i++) {
      const u = await client.users.fetch(sorted[i][0]);
      out += `${i + 1}. ${u.username} — ${format(sorted[i][1])}\n`;
    }
    return msg.reply(out);
  }

  if (text === "report") {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply("❌ Admin only");

    const data = dailyAttendance[today()];
    if (!data) return msg.reply("No records");

    let out = "📊 **Admin Report**\n";
    for (const [id, time] of Object.entries(data)) {
      const u = await client.users.fetch(id);
      out += `${u.username} — ${format(time)}\n`;
    }
    return msg.reply(out);
  }
});

client.login(process.env.TOKEN);
