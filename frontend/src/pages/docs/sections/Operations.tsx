import { DocPage, K, Sub, Ul } from "../_shared";
import { useDocsContent } from "../content";

const Operations = () => {
  const page = useDocsContent().pages.operations;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="environments" title={page.sections.environments.title}>
        <p>{page.sections.environments.body}</p>
      </Sub>

      <Sub id="logs" title={page.sections.logs.title}>
        <p>{page.sections.logs.body}</p>
      </Sub>

      <Sub id="database" title={page.sections.database.title}>
        <p>{page.sections.database.intro}</p>
        <Ul>
          {page.sections.database.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ul>
      </Sub>

      <Sub id="backups" title="Backups">
        <p>
          Because the chain stores the cryptographic anchor for every credential,
          restoring Mongo from a snapshot doesn't rewrite history — the chain
          authoritatively confirms whether a token still exists. Back up the
          uploads directory separately; it holds the original PDFs.
        </p>
      </Sub>
      <Sub id="notifications" title="Telegram Notifications">
        <p>
          Altrium uses a central Telegram Bot to push instant notifications for Degree Approvals, Rejections, and Registration Events.
        </p>
        <Ul>
          <li><K>TELEGRAM_BOT_TOKEN</K> (Backend) — The BotFather API token for your official bot.</li>
          <li><K>VITE_TELEGRAM_BOT_USERNAME</K> (Frontend) — The username of your bot (without the @). Used to dynamically generate the bot link for students.</li>
        </Ul>
        <p className="mt-3">
          <b>Production Setup:</b> Create a single official bot via <K>@BotFather</K> and set these environment variables. Users will provide their personal Telegram ID during registration and click "Start" on your official bot. The backend uses the central token to securely message users.
        </p>
      </Sub>
    </DocPage>
  );
};

export default Operations;
