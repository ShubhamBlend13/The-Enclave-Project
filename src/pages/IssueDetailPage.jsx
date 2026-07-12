import { useState } from "react";

import Btn from "../components/Btn";
import Chip from "../components/Chip";
import Field from "../components/Field";
import {
  getIssueCategory,
  ISSUE_STATUSES,
  ISSUE_STATUS_DISPLAY,
} from "../constants/issues";
import { canResolveIssues } from "../constants/roles";
import { THEME } from "../constants/theme";
import { formatDateTime } from "../utils/date";
import { createId } from "../utils/id";

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 14px",
  border: `1.5px solid ${THEME.line}`,
  borderRadius: 12,
  background: THEME.card,
  color: THEME.ink,
  fontSize: 15,
  outline: "none",
};

function IssueDetailPage({
  issue,
  profile,
  activeArea,
  onBack,
  onUpdate,
}) {
  const [note, setNote] = useState("");

  const category = getIssueCategory(issue.category);

  const status =
    ISSUE_STATUS_DISPLAY[issue.status] ??
    ISSUE_STATUS_DISPLAY.open;

  const canManageIssue = canResolveIssues(profile);

  // Older demo issues do not yet contain an updates array.
  const timeline =
    issue.updates?.length > 0
      ? issue.updates
      : [
          {
            id: `${issue.id}-reported`,
            message: "Issue reported",
            createdBy: issue.reportedBy,
            createdAt: issue.createdAt,
          },
        ];

  const applyUpdate = ({
    nextStatus = null,
    fallbackMessage,
  }) => {
    const timestamp = new Date().toISOString();
    const message =
      note.trim() || fallbackMessage;

    const updatedIssue = {
      ...issue,
      status: nextStatus ?? issue.status,
      updatedAt: timestamp,
      resolvedAt:
        nextStatus === ISSUE_STATUSES.RESOLVED
          ? timestamp
          : nextStatus
            ? null
            : issue.resolvedAt,
      updates: [
        ...timeline,
        {
          id: createId(),
          message,
          createdBy: profile.fullName,
          createdAt: timestamp,
        },
      ],
    };

    onUpdate(updatedIssue);
    setNote("");
  };

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: 0,
          border: "none",
          background: "transparent",
          color: THEME.green,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ← All issues
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h1
          style={{
            margin: 0,
            color: THEME.ink,
            fontFamily: "'Marcellus', serif",
            fontSize: 24,
            fontWeight: 400,
            lineHeight: 1.25,
          }}
        >
          {category.icon} {category.label}
        </h1>

        <Chip
          color={status.color}
          background={status.bg}
        >
          {status.label}
        </Chip>
      </div>

      <div
        style={{
          margin: "8px 0 18px",
          color: THEME.mute,
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        {activeArea?.name}
        {issue.location
          ? ` · ${issue.location}`
          : ""}
        <br />
        Reported by {issue.reportedBy}
        {" · "}
        {formatDateTime(issue.createdAt)}
      </div>

      {issue.priority === "Urgent" && (
        <div
          style={{
            marginBottom: 12,
          }}
        >
          <Chip
            color={THEME.red}
            background="#F7E6E0"
          >
            Urgent priority
          </Chip>
        </div>
      )}

      <div
        style={{
          padding: 16,
          border: `1px solid ${THEME.line}`,
          borderRadius: 16,
          background: THEME.card,
          color: THEME.ink,
          fontSize: 14.5,
          lineHeight: 1.55,
        }}
      >
        {issue.description}
      </div>

      <div
        style={{
          margin: "24px 0 12px",
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Timeline
      </div>

      <div
        style={{
          marginLeft: 7,
          paddingLeft: 18,
          borderLeft: `2px solid ${THEME.line}`,
        }}
      >
        {[...timeline]
          .reverse()
          .map((update, index) => (
            <div
              key={update.id}
              style={{
                position: "relative",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: -24.5,
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background:
                    index === 0
                      ? THEME.brass
                      : THEME.line,
                }}
              />

              <div
                style={{
                  color: THEME.ink,
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {update.message}
              </div>

              <div
                style={{
                  marginTop: 2,
                  color: THEME.mute,
                  fontSize: 12,
                }}
              >
                {update.createdBy}
                {" · "}
                {formatDateTime(update.createdAt)}
              </div>
            </div>
          ))}
      </div>

      {canManageIssue && (
        <div
          style={{
            marginTop: 24,
          }}
        >
          <Field label="Add an update">
            <input
              type="text"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder="e.g. Electrician scheduled for tomorrow"
              style={INPUT_STYLE}
            />
          </Field>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {note.trim() && (
              <Btn
                variant="quiet"
                onClick={() =>
                  applyUpdate({
                    fallbackMessage: note.trim(),
                  })
                }
                style={{
                  width: "auto",
                  flex: 1,
                }}
              >
                Post note
              </Btn>
            )}

            {issue.status === ISSUE_STATUSES.OPEN && (
              <Btn
                variant="brass"
                onClick={() =>
                  applyUpdate({
                    nextStatus:
                      ISSUE_STATUSES.PROGRESS,
                    fallbackMessage: "Work started",
                  })
                }
                style={{
                  width: "auto",
                  flex: 1,
                }}
              >
                Start work
              </Btn>
            )}

            {issue.status !==
              ISSUE_STATUSES.RESOLVED && (
              <Btn
                onClick={() =>
                  applyUpdate({
                    nextStatus:
                      ISSUE_STATUSES.RESOLVED,
                    fallbackMessage: "Issue resolved",
                  })
                }
                style={{
                  width: "auto",
                  flex: 1,
                }}
              >
                Mark resolved
              </Btn>
            )}

            {issue.status ===
              ISSUE_STATUSES.RESOLVED && (
              <Btn
                variant="ghost"
                onClick={() =>
                  applyUpdate({
                    nextStatus: ISSUE_STATUSES.OPEN,
                    fallbackMessage: "Issue reopened",
                  })
                }
                style={{
                  width: "auto",
                  flex: 1,
                }}
              >
                Reopen
              </Btn>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default IssueDetailPage;