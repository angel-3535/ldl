import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { listBuilds, createBuild } from "../../db";
import type { Build } from "../../db";
import { championSquareIcon } from "../../components/ChampionDrawer";
import "./index.css";

const DDRAGON = "https://ddragon.leagueoflegends.com/cdn/img";
const DDRAGON_VERSION = "15.4.1";

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`;
}

const KEYSTONE_ICONS: Record<number, string> = {
  8005: "perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png",
  8021: "perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png",
  8010: "perk-images/Styles/Precision/Conqueror/Conqueror.png",
  8112: "perk-images/Styles/Domination/Electrocute/Electrocute.png",
  8128: "perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png",
  9923: "perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png",
  8214: "perk-images/Styles/Sorcery/SummonAery/SummonAery.png",
  8229: "perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png",
  8230: "perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png",
  8437: "perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
  8439: "perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
  8465: "perk-images/Styles/Resolve/Guardian/Guardian.png",
  8351: "perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png",
  8360: "perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
  8369: "perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png",
};

const PATH_ICONS: Record<number, string> = {
  8000: "perk-images/Styles/7201_Precision.png",
  8100: "perk-images/Styles/7200_Domination.png",
  8200: "perk-images/Styles/7202_Sorcery.png",
  8400: "perk-images/Styles/7204_Resolve.png",
  8300: "perk-images/Styles/7203_Whimsy.png",
};

const PATH_COLORS: Record<number, string> = {
  8000: "#c8aa6e",
  8100: "#d44242",
  8200: "#9faafc",
  8400: "#a8d26a",
  8300: "#49aab9",
};

function BuildListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: builds, isLoading } = useQuery({
    queryKey: ["builds"],
    queryFn: listBuilds,
  });

  const createMutation = useMutation({
    mutationFn: createBuild,
    onSuccess: (build) => {
      queryClient.invalidateQueries({ queryKey: ["builds"] });
      navigate({ to: "/build/$id", params: { id: build.id } });
    },
  });

  const handleCreate = useCallback(() => {
    const name = newName.trim() || "New Build";
    createMutation.mutate(name);
    setNewName("");
    setCreating(false);
  }, [newName, createMutation]);

  const getKeystoneId = (build: Build): number | null => {
    if (build.primarySelections && build.primarySelections[0]) {
      return build.primarySelections[0];
    }
    return null;
  };

  return (
    <div className="build-page">
      <div className="build-bg-pattern" />

      <header className="build-header">
        <div className="build-header-row">
          <Link to="/" className="build-back-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Canvas
          </Link>
        </div>
        <h1 className="build-title">Builds</h1>
        <p className="build-subtitle">Create and manage champion builds</p>
      </header>

      <div className="build-list-container">
        {creating ? (
          <div className="build-create-form">
            <input
              className="build-create-input"
              type="text"
              placeholder="Build name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewName("");
                }
              }}
              autoFocus
            />
            <div className="build-create-actions">
              <button className="build-create-confirm" onClick={handleCreate}>
                Create
              </button>
              <button
                className="build-create-cancel"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="build-create-btn"
            onClick={() => setCreating(true)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Build
          </button>
        )}

        <div className="build-section-divider">
          <div className="build-section-divider-line" />
          <div className="build-section-divider-diamond" />
          <div className="build-section-divider-line" />
        </div>

        {isLoading && <div className="build-list-loading">Loading...</div>}

        {!isLoading && (!builds || builds.length === 0) && (
          <div className="build-list-empty">
            <div className="build-list-empty-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#785a28"
                strokeWidth="1"
                strokeLinecap="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p>No builds yet</p>
            <p className="build-list-empty-hint">Create one to get started</p>
          </div>
        )}

        <div className="build-list-grid">
          {builds?.map((build: Build) => {
            const keystoneId = getKeystoneId(build);
            const pathColor = build.primaryPathId
              ? PATH_COLORS[build.primaryPathId]
              : "#785a28";

            return (
              <Link
                key={build.id}
                to="/build/$id"
                params={{ id: build.id }}
                className="build-card"
                style={{ "--build-accent": pathColor } as React.CSSProperties}
              >
                {build.championKey && (
                  <div className="build-card-champion">
                    <img
                      src={championSquareIcon(build.championKey)}
                      alt={build.championName || ""}
                    />
                  </div>
                )}
                <div className="build-card-info">
                  <div className="build-card-name">{build.name}</div>
                  <div className="build-card-meta">
                    {/* Keystone + Secondary path combo */}
                    {keystoneId && KEYSTONE_ICONS[keystoneId] ? (
                      <div
                        className="build-card-rune-combo"
                        style={
                          { "--build-accent": pathColor } as React.CSSProperties
                        }
                      >
                        <div className="build-card-keystone">
                          <img
                            src={`${DDRAGON}/${KEYSTONE_ICONS[keystoneId]}`}
                            alt="Keystone"
                          />
                        </div>
                        {build.secondaryPathId &&
                          PATH_ICONS[build.secondaryPathId] && (
                            <div className="build-card-secondary">
                              <img
                                src={`${DDRAGON}/${PATH_ICONS[build.secondaryPathId]}`}
                                alt="Secondary"
                              />
                            </div>
                          )}
                      </div>
                    ) : build.primaryPathId &&
                      PATH_ICONS[build.primaryPathId] ? (
                      <div
                        className="build-card-rune-combo"
                        style={
                          { "--build-accent": pathColor } as React.CSSProperties
                        }
                      >
                        <div className="build-card-keystone">
                          <img
                            src={`${DDRAGON}/${PATH_ICONS[build.primaryPathId]}`}
                            alt="Path"
                          />
                        </div>
                        {build.secondaryPathId &&
                          PATH_ICONS[build.secondaryPathId] && (
                            <div className="build-card-secondary">
                              <img
                                src={`${DDRAGON}/${PATH_ICONS[build.secondaryPathId]}`}
                                alt="Secondary"
                              />
                            </div>
                          )}
                      </div>
                    ) : (
                      <span className="build-card-empty-hint">
                        No runes selected
                      </span>
                    )}
                    {build.items.length > 0 && (
                      <div className="build-card-items">
                        {build.items.slice(0, 6).map((item) => (
                          <img
                            key={item.slot}
                            className="build-card-item-icon"
                            src={itemIcon(item.icon)}
                            alt={item.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/build/")({
  component: BuildListPage,
});
