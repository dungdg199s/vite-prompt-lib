import { uiClasses } from "../shared/uiClasses";

export default function PromptContentPreview({ content }) {
  if (!content) return null;

  return (
    <section className={uiClasses.card}>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Content Preview</h2>
      <pre className={uiClasses.darkCodeBlock}>
        {content}
      </pre>
    </section>
  );
}
