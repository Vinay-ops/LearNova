import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

const EFFECTIVE_DATE = "2026-09-20";

const sections: LegalSection[] = [
  {
    heading: "What we collect",
    body: (
      <>
        <p>This list reflects what the application actually stores today:</p>
        <ul>
          <li>
            <strong>Account:</strong> your email address, an Argon2 password
            hash (never the password itself), and account timestamps.
          </li>
          <li>
            <strong>Profile:</strong> display name, optional avatar URL,
            experience level, target firms, interview date, readiness score.
          </li>
          <li>
            <strong>Learning and practice content:</strong> your chat messages
            with the AI tutor, generated quizzes and your answers, drill
            attempts, case attempts and their scores.
          </li>
          <li>
            <strong>Interview content:</strong> interview sessions, the
            interviewer's questions, your typed or transcribed answers, and the
            resulting evaluation, feedback and recommendations.
          </li>
          <li>
            <strong>Resumes:</strong> the structured data parsed from a resume
            you upload (name, title, summary, skills, technologies, projects,
            experience, education, certifications). The original uploaded file
            is not retained.
          </li>
          <li>
            <strong>Progress:</strong> derived scores, skill measurements and
            readiness snapshots.
          </li>
        </ul>
        <p>
          We do not intentionally collect special-category data. Please do not
          submit it in resumes, chat or interview answers.
        </p>
      </>
    ),
  },
  {
    heading: "Voice input",
    body: (
      <>
        <p>
          The voice interview uses your browser's built-in speech recognition.
          Audio is converted to text by your browser or its speech provider and
          only the resulting <strong>transcript</strong> is sent to Learnova. No
          audio recording is transmitted to or stored on our servers.
        </p>
      </>
    ),
  },
  {
    heading: "Why we use it",
    body: (
      <>
        <p>
          We use your data to provide the features you request: to run the AI
          tutor, generate and score quizzes, evaluate interviews, tailor
          questions to your resume, and show your progress. We also use
          aggregated technical logs to keep the service secure and working.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: state the lawful basis for processing for each
          purpose under GDPR/UK GDPR, and confirm whether any processing relies on
          consent.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Who processes it",
    body: (
      <>
        <p>
          We share data with the service providers that run the platform, acting
          on our instructions:
        </p>
        <ul>
          <li>
            <strong>Hosting and application infrastructure</strong> — serves the
            application and API.
          </li>
          <li>
            <strong>Database hosting</strong> — stores the account, content and
            progress records listed above.
          </li>
          <li>
            <strong>AI provider</strong> — receives the text needed for the
            feature you invoked (for example a resume's parsed content, an
            interview answer, or a chat message) in order to generate the
            response. Prompts and outputs are subject to that provider's own
            retention terms.
          </li>
        </ul>
        <p>
          We do not sell your personal data.{" "}
          <strong>[REVIEW REQUIRED: name the actual providers, their locations,
          and put data-processing agreements in place for each.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "International transfers",
    body: (
      <>
        <p>
          <strong>[REVIEW REQUIRED: identify the regions your database and AI
          provider process data in, and the transfer mechanism relied on
          (for example Standard Contractual Clauses).]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <>
        <p>
          Your account, content and progress records are kept while your account
          exists. Deleting your account removes the associated profile, resumes,
          interview sessions and messages, quiz and case attempts, and progress
          records, subject to any legally required retention.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: set a concrete retention period, including for
          backups and security logs, and align it with the account-deletion
          implementation.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Security",
    body: (
      <>
        <p>
          Passwords are hashed with Argon2 and authentication uses signed,
          expiring tokens. Access to your records is scoped to your account on
          the server side, so one user cannot read another's data. Traffic to
          the API is encrypted in transit in production.
        </p>
        <p>
          No system is perfectly secure. If you believe your account has been
          compromised, contact us and we will help you secure it.
        </p>
      </>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have the right to access, correct,
          export or delete your personal data, and to object to or restrict some
          processing. Account deletion removes the data described above.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: list the specific rights for your target
          jurisdictions, the request process, and the statutory response
          deadline. Insert a working privacy contact and, where required, a
          data-protection officer or EU/UK representative.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Cookies and local storage",
    body: (
      <>
        <p>
          Learnova does not set advertising or third-party tracking cookies. It
          stores your access token in the browser's local storage so you stay
          signed in, and it uses a per-tab session marker to avoid creating
          duplicate interview sessions. Signing out clears the token.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: confirm whether any analytics or error-tracking
          tool is added later; if so this section and a consent banner are
          required.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Children",
    body: (
      <>
        <p>
          Learnova is not directed at children.{" "}
          <strong>[REVIEW REQUIRED: align the minimum age here with the minimum
          age stated in the Terms.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <>
        <p>
          If this policy changes materially, the effective date changes and
          existing users are asked to review and accept the new revision before
          continuing to use Learnova.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      effectiveDate={EFFECTIVE_DATE}
      intro="This policy explains what Learnova stores, why, who else processes it, and the choices you have. It describes the product as it is actually built."
      sections={sections}
    />
  );
}
