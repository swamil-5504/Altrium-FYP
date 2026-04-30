import { DocPage, K, Sub } from "../_shared";

const Notifications = () => (
  <DocPage
    kicker="Platform ops"
    title="Telegram Bot"
    summary="How Altrium uses a central Telegram Bot to push instant notifications for Degree Approvals, Rejections, and Registration Events."
  >
    <Sub id="overview" title="Overview">
      <p>
        Instead of managing a complex email infrastructure, Altrium leverages Telegram for instant, reliable push notifications. The bot operates in a <strong>push-only</strong> mode — it does not read user messages or respond to commands.
      </p>
    </Sub>

    <Sub id="production-setup" title="Production Setup">
      <p>
        In a production environment, you must use a single, central official bot.
      </p>
      <ol className="list-decimal pl-5 space-y-2 mt-3 marker:text-[#2563eb] dark:marker:text-[#60a5fa] marker:font-semibold">
        <li>Create a single official bot via <K>@BotFather</K> on Telegram.</li>
        <li>Set <K>TELEGRAM_BOT_TOKEN</K> in your backend <K>.env</K>.</li>
        <li>Set <K>VITE_TELEGRAM_BOT_USERNAME</K> (e.g. <K>Altrium_Notification_Bot</K>) in your frontend <K>.env</K>.</li>
      </ol>
      <p className="mt-4">
        When users register on the website, they will provide their personal Telegram ID and be instructed to click "Start" on your official bot. The backend uses the central token to securely message individual users.
      </p>
    </Sub>

    <Sub id="local-dev" title="Local Development">
      <p>
        For local testing, do not use the production token. Create your own test bot via <K>@BotFather</K>, grab the token, and put it in your local <K>.env</K> files. Users never need to create their own bots.
      </p>
    </Sub>
  </DocPage>
);

export default Notifications;
