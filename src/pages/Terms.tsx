import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

const EFFECTIVE_DATE = "2026-09-20";

const sections: LegalSection[] = [
  {
    heading: "What Learnova is",
    body: (
      <>
        <p>
          Learnova is an AI-assisted learning and interview-preparation tool. It
          offers learning-chat topics, generated quizzes and practice drills,
          mock interviews (typed or by voice), resume-based question generation,
          and progress tracking.
        </p>
        <p>
          Learnova is a study aid. It is not an employer, a recruiter, a
          certification body, or an accreditation service, and it does not
          guarantee any interview outcome or job offer.
        </p>
      </>
    ),
  },
  {
    heading: "Your account",
    body: (
      <>
        <p>
          You must provide a valid email address and keep your password
          confidential. You are responsible for activity under your account.
        </p>
        <p>
          You must be old enough to enter into a binding agreement in your
          jurisdiction.{" "}
          <strong>[REVIEW REQUIRED: set and confirm the minimum age, e.g. 16 or
          18, and any parental-consent requirement.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>attempt to access another user's account, resumes or data;</li>
          <li>
            probe, scan or overload the service, or circumvent rate limits and
            authentication;
          </li>
          <li>
            upload malware, or content you do not have the right to share;
          </li>
          <li>
            use the service to generate unlawful, harassing or infringing
            content, or to misrepresent AI output as human professional advice;
          </li>
          <li>
            attempt to extract, reverse-engineer or resell the underlying
            prompts, models or evaluation logic.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "AI-generated content",
    body: (
      <>
        <p>
          <strong>
            Output from the AI features can be inaccurate, incomplete or
            misleading.
          </strong>{" "}
          Quiz answer keys, interview evaluations, feedback and recommendations
          are generated automatically from your input and are provided for
          practice purposes only. You are responsible for verifying anything you
          rely on.
        </p>
        <p>
          Learnova does not provide legal, medical, financial or employment
          advice, and AI output is not a substitute for professional judgement.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: confirm the exact AI-disclaimer wording and
          any required model-output disclosure for the jurisdictions you serve.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Your content",
    body: (
      <>
        <p>
          You keep ownership of the content you submit, including your resumes,
          answers and messages. You grant Learnova the limited licence needed to
          operate the service for you: to store that content, and to send it to
          our AI provider so the requested feature can run.
        </p>
        <p>
          We do not claim ownership of your resumes or interview answers, and we
          do not use them to train models. See the Privacy Policy for what is
          stored and for how long.
        </p>
      </>
    ),
  },
  {
    heading: "Availability and changes to the service",
    body: (
      <>
        <p>
          The service is provided on an as-is basis and may change, be suspended
          or be discontinued. We may update these Terms; when we do, the
          effective date changes and you will be asked to accept the new
          revision before continuing to use the product.
        </p>
      </>
    ),
  },
  {
    heading: "Fees",
    body: (
      <>
        <p>
          Learnova is currently offered without payment. If paid plans are
          introduced, pricing, billing, renewal and refund terms will be added
          here before any charge is made.{" "}
          <strong>[REVIEW REQUIRED: payment, tax and consumer-cancellation terms.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Suspension and termination",
    body: (
      <>
        <p>
          You may stop using Learnova at any time and request deletion of your
          account and data. We may suspend or terminate an account that breaches
          these Terms or that we reasonably believe creates a security or legal
          risk.
        </p>
      </>
    ),
  },
  {
    heading: "Disclaimers and limitation of liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, Learnova is provided without
          warranties and we are not liable for indirect or consequential losses,
          or for decisions you take based on AI-generated output.
        </p>
        <p>
          <strong>[REVIEW REQUIRED: the enforceability, wording and caps of
          liability exclusions vary significantly by jurisdiction, and some
          consumer protections cannot be excluded.]</strong>
        </p>
      </>
    ),
  },
  {
    heading: "Governing law",
    body: (
      <>
        <p>
          <strong>[REVIEW REQUIRED: specify the governing jurisdiction and venue,
          chosen with the entity's place of incorporation and your target market
          in mind.]</strong>
        </p>
      </>
    ),
  },
];

export default function Terms() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      effectiveDate={EFFECTIVE_DATE}
      intro="These Terms describe the agreement between you and Learnova for use of the Learnova platform. By creating an account you confirm that you have read, understood and accepted them."
      sections={sections}
    />
  );
}
