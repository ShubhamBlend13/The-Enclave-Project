import { useState } from "react";

import Btn from "../components/Btn";
import Field from "../components/Field";
import { ALL_AREAS_CODE } from "../constants/areas";
import {
  canManageResidents,
  canPostAnnouncements,
  isOwnerAdmin,
} from "../constants/roles";
import { THEME } from "../constants/theme";
import { formatDateTime } from "../utils/date";

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

function CommunityPage({
  profile,
  activeArea,
  announcements,
  onPostAnnouncement,
  onOpenAccountManagement,
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishing, setPublishing] = useState(false);

  const isAllAreas =
    activeArea?.code === ALL_AREAS_CODE;

  const canPublish =
    canPostAnnouncements(profile) &&
    !isAllAreas;

  const canOpenAccountManagement =
    canManageResidents(profile) ||
    isOwnerAdmin(profile);

  const canSubmit =
    Boolean(title.trim()) &&
    Boolean(body.trim()) &&
    !publishing;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canPublish || !canSubmit) {
      return;
    }

    setPublishing(true);

    try {
      // Announcements always belong to the currently selected real area.
      await onPostAnnouncement({
        title: title.trim(),
        body: body.trim(),
      });

      setTitle("");
      setBody("");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section>
      <h1
        style={{
          margin: "4px 0 4px",
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 28,
          fontWeight: 400,
        }}
      >
        Community
      </h1>

      <p
        style={{
          margin: "0 0 18px",
          color: THEME.mute,
          fontSize: 14,
        }}
      >
        {isAllAreas
          ? "Select an area to view its announcements."
          : `Announcements for ${activeArea?.name}`}
      </p>

      {canOpenAccountManagement && (
        <button
          type="button"
          onClick={onOpenAccountManagement}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
            padding: 16,
            border: `1px solid ${THEME.line}`,
            borderRadius: 16,
            background: THEME.card,
            color: THEME.ink,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {isOwnerAdmin(profile)
                ? "Account management"
                : `Manage Villa ${profile.homeAreaCode} residents`}
            </div>

            <div
              style={{
                marginTop: 3,
                color: THEME.mute,
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            >
              {isOwnerAdmin(profile)
                ? "Manage villa admins and the upkeep manager."
                : "Add residents, reset passwords and manage access."}
            </div>
          </div>

          <span
            style={{
              color: THEME.brass,
              fontSize: 20,
            }}
          >
            →
          </span>
        </button>
      )}

      {canPublish && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 22,
            padding: 16,
            border: `1px solid ${THEME.line}`,
            borderRadius: 16,
            background: THEME.card,
          }}
        >
          <div
            style={{
              marginBottom: 12,
              color: THEME.mute,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Post an announcement
          </div>

          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Water supply maintenance"
              style={INPUT_STYLE}
            />
          </Field>

          <Field label="Announcement">
            <textarea
              value={body}
              onChange={(event) =>
                setBody(event.target.value)
              }
              placeholder={`Share an update for ${activeArea?.name}.`}
              rows={4}
              style={{
                ...INPUT_STYLE,
                minHeight: 90,
                resize: "vertical",
              }}
            />
          </Field>

          <Btn
            type="submit"
            disabled={!canSubmit}
          >
            {publishing
              ? "Publishing..."
              : `Publish to ${activeArea?.name}`}
          </Btn>
        </form>
      )}

      <div
        style={{
          marginBottom: 10,
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Announcements
      </div>

      {isAllAreas ? (
        <EmptyAnnouncementState
          title="Choose an area"
          message="Announcements are kept separate for each villa and the clubhouse."
        />
      ) : announcements.length === 0 ? (
        <EmptyAnnouncementState
          title="Nothing posted yet"
          message={`There are no announcements for ${activeArea?.name}.`}
        />
      ) : (
        announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
          />
        ))
      )}

      <RoadmapSection />
    </section>
  );
}

function AnnouncementCard({ announcement }) {
  return (
    <article
      style={{
        marginBottom: 10,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
      }}
    >
      <div
        style={{
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 17,
        }}
      >
        {announcement.title}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#42504A",
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        {announcement.body}
      </div>

      <div
        style={{
          marginTop: 8,
          color: THEME.mute,
          fontSize: 11.5,
        }}
      >
        {announcement.createdBy}
        {" · "}
        {formatDateTime(announcement.createdAt)}
      </div>
    </article>
  );
}

function EmptyAnnouncementState({
  title,
  message,
}) {
  return (
    <div
      style={{
        marginBottom: 22,
        padding: "32px 20px",
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          fontSize: 30,
        }}
      >
        📣
      </div>

      <div
        style={{
          color: THEME.ink,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          color: THEME.mute,
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
    </div>
  );
}

function RoadmapSection() {
  const roadmapItems = [
    {
      icon: "🛂",
      title: "Visitor authorization",
      description:
        "Pre-approve guests and deliveries at the gate.",
    },
    {
      icon: "🎾",
      title: "Amenity booking",
      description:
        "Reserve shared community amenities.",
    },
    {
      icon: "👥",
      title: "Staff management",
      description:
        "Household staff access and attendance.",
    },
    {
      icon: "💳",
      title: "Maintenance dues",
      description:
        "Bills, receipts and community funds.",
    },
  ];

  return (
    <>
      <div
        style={{
          margin: "26px 0 10px",
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        On the roadmap
      </div>

      {roadmapItems.map((item) => (
        <div
          key={item.title}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
            padding: "12px 14px",
            border: `1px dashed ${THEME.line}`,
            borderRadius: 14,
            background: THEME.card,
            opacity: 0.8,
          }}
        >
          <div
            style={{
              fontSize: 20,
            }}
          >
            {item.icon}
          </div>

          <div>
            <div
              style={{
                color: THEME.ink,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: THEME.mute,
                fontSize: 12,
              }}
            >
              {item.description}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default CommunityPage;