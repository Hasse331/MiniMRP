import type { VersionDetail } from "@/lib/types/domain";
import { EmptyState, Panel } from "@/shared/ui";

export function VersionAttachmentsPanel(props: { version: VersionDetail | null }) {
  return (
    <Panel title="Attachments" description="Files linked to this version.">
      {props.version?.attachments.length ? (
        <div className="stack">
          {props.version.attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.file_path}
              target="_blank"
              rel="noreferrer"
              className="button-link subtle"
            >
              {attachment.file_path}
            </a>
          ))}
        </div>
      ) : (
        <EmptyState>No attachments found for this version.</EmptyState>
      )}
    </Panel>
  );
}
