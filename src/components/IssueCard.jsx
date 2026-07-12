import Chip from "./Chip";
import {
  getIssueCategory,
  ISSUE_STATUS_DISPLAY,
} from "../constants/issues";
import { THEME } from "../constants/theme";
import { formatDateTime } from "../utils/date";

function IssueCard({
  issue,
  onOpen,
  showArea = false,
}) {
  const category = getIssueCategory(issue.category);

  // Unknown status values fall back to the Open presentation.
  const status =
    ISSUE_STATUS_DISPLAY[issue.status] ??
    ISSUE_STATUS_DISPLAY.open;

  const isUrgent =
    issue.priority === "Urgent" &&
    issue.status !== "resolved";

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "block",
        width: "100%",
        marginBottom: 12,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
        boxShadow: "0 1px 3px rgba(28, 43, 38, 0.05)",
        color: THEME.ink,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: THEME.greenSoft,
              fontSize: 19,
            }}
          >
            {category.icon}
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                overflow: "hidden",
                color: THEME.ink,
                fontSize: 15,
                fontWeight: 600,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {category.label}
              {issue.location
                ? ` · ${issue.location}`
                : ""}
            </div>

            <div
              style={{
                marginTop: 2,
                color: THEME.mute,
                fontSize: 12.5,
              }}
            >
              {showArea && (
                <>
                  {issue.areaCode === "CLUBHOUSE"
                    ? "Clubhouse"
                    : `Villa ${issue.areaCode}`}
                  {" · "}
                </>
              )}

              {formatDateTime(issue.createdAt)}
            </div>
          </div>
        </div>

        <Chip
          color={status.color}
          background={status.bg}
        >
          {status.label}
        </Chip>
      </div>

      <div
        style={{
          display: "-webkit-box",
          marginTop: 10,
          overflow: "hidden",
          color: "#42504A",
          fontSize: 13.5,
          lineHeight: 1.45,
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {issue.description}
      </div>

      {isUrgent && (
        <div
          style={{
            marginTop: 8,
          }}
        >
          <Chip
            color={THEME.red}
            background="#F7E6E0"
          >
            Urgent
          </Chip>
        </div>
      )}
    </button>
  );
}

export default IssueCard;