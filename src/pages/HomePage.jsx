import Btn from "../components/Btn";
import VillaStrip from "../components/VillaStrip";
import { THEME } from "../constants/theme";
import { formatDueDate, formatDateTime } from "../utils/date";

function HomePage({
  profile,
  activeArea,
  issues,
  announcements,
  upkeepTasks,
  onNavigate,
}) {
  // All collections reaching this page are already filtered by the active area.
  const openIssues = issues.filter(
    (issue) => issue.status !== "resolved",
  );

  const latestAnnouncement = announcements[0] ?? null;

  const nextUpkeepTask = [...upkeepTasks].sort(
    (first, second) =>
      new Date(first.nextDue).getTime() -
      new Date(second.nextDue).getTime(),
  )[0] ?? null;

  const firstName =
    profile.fullName?.trim().split(/\s+/)[0] || "there";

  return (
    <section>
      <div
        style={{
          marginBottom: 4,
          color: THEME.brass,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2.5,
        }}
      >
        THE ENCLAVE
      </div>

      <h1
        style={{
          margin: 0,
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1.15,
        }}
      >
        Welcome,
        <br />
        {firstName}
      </h1>

      <div
        style={{
          marginTop: 6,
          marginBottom: 18,
          color: THEME.mute,
          fontSize: 13.5,
        }}
      >
        {activeArea?.name}
      </div>

      <div
        style={{
          marginBottom: 16,
          padding: "18px 16px 14px",
          border: `1px solid ${THEME.line}`,
          borderRadius: 18,
          background: THEME.card,
        }}
      >
        <VillaStrip activeAreaCode={activeArea?.code} />
      </div>

      <Btn
        variant="brass"
        onClick={() => onNavigate("report")}
        style={{
          marginBottom: 12,
          fontSize: 16,
        }}
      >
        ＋ Report an issue
      </Btn>

      <button
        type="button"
        onClick={() => onNavigate("issues")}
        style={{
          display: "flex",
          width: "100%",
          marginBottom: 12,
          padding: 16,
          alignItems: "center",
          justifyContent: "space-between",
          border: `1px solid ${THEME.line}`,
          borderRadius: 16,
          background: THEME.card,
          color: THEME.ink,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {openIssues.length === 0
              ? "No open issues"
              : `${openIssues.length} open issue${
                  openIssues.length === 1 ? "" : "s"
                }`}
          </div>

          <div
            style={{
              marginTop: 2,
              color: THEME.mute,
              fontSize: 12.5,
            }}
          >
            {issues.length} total for {activeArea?.name}
          </div>
        </div>

        <span
          aria-hidden="true"
          style={{
            color: THEME.green,
            fontSize: 20,
          }}
        >
          →
        </span>
      </button>

      {nextUpkeepTask && (
        <button
          type="button"
          onClick={() => onNavigate("upkeep")}
          style={{
            display: "flex",
            width: "100%",
            marginBottom: 12,
            padding: 16,
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${THEME.line}`,
            borderRadius: 16,
            background: THEME.card,
            color: THEME.ink,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                overflow: "hidden",
                fontSize: 15,
                fontWeight: 600,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nextUpkeepTask.icon} {nextUpkeepTask.title}
            </div>

            <div
              style={{
                marginTop: 3,
                color: THEME.mute,
                fontSize: 12.5,
              }}
            >
              Due {formatDueDate(nextUpkeepTask.nextDue)}
              {" · "}
              Upkeep schedule
            </div>
          </div>

          <span
            aria-hidden="true"
            style={{
              marginLeft: 10,
              color: THEME.green,
              fontSize: 20,
            }}
          >
            →
          </span>
        </button>
      )}

      <div
        style={{
          marginBottom: 12,
          padding: 18,
          borderRadius: 16,
          background: THEME.green,
          color: "#EFEAE0",
        }}
      >
        <div
          style={{
            marginBottom: 6,
            fontSize: 11,
            letterSpacing: 2,
            opacity: 0.7,
          }}
        >
          ANNOUNCEMENT
        </div>

        {latestAnnouncement ? (
          <>
            <div
              style={{
                marginBottom: 4,
                fontFamily: "'Marcellus', serif",
                fontSize: 18,
              }}
            >
              {latestAnnouncement.title}
            </div>

            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.5,
                opacity: 0.85,
              }}
            >
              {latestAnnouncement.body}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 11.5,
                opacity: 0.6,
              }}
            >
              {formatDateTime(latestAnnouncement.createdAt)}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            No announcements for {activeArea?.name}.
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <RoadmapCard
          icon="🛂"
          title="Visitor pass"
        />

        <RoadmapCard
          icon="🎾"
          title="Book amenity"
        />
      </div>
    </section>
  );
}

function RoadmapCard({ icon, title }) {
  return (
    <div
      style={{
        padding: 14,
        border: `1px dashed ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
        opacity: 0.75,
      }}
    >
      <div
        style={{
          fontSize: 20,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 6,
          color: THEME.ink,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 2,
          color: THEME.brass,
          fontSize: 11.5,
          fontWeight: 600,
        }}
      >
        Coming soon
      </div>
    </div>
  );
}

export default HomePage;