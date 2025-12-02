// src/Navbar.jsx
import React, { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  SignUpButton,
  useUser,
} from "@clerk/clerk-react";
import { FiBell, FiX, FiEye, FiMenu, FiLogOut } from "react-icons/fi";
import "./Navbar.css";

export default function PosturePalNavbar({ alerts = [], onMarkRead, onMarkAllRead }) {
  const [openAlerts, setOpenAlerts] = useState(false);
  const [unread, setUnread] = useState(() => alerts.filter(a => !a.read).length);
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUnread(alerts.filter(a => !a.read).length);
  }, [alerts]);

  function markAllRead() {
    if (onMarkAllRead) onMarkAllRead();
    setUnread(0);
    setOpenAlerts(false);
  }

  function markRead(id) {
    if (onMarkRead) onMarkRead(id);
  }

  function goToPreview() {
    if (isSignedIn) return (window.location.href = "/preview");

    const trigger = document.getElementById("pp-clerk-signup-trigger");
    if (trigger) trigger.click();
    else window.location.href = `/sign-up?redirect_url=/preview`;
  }

  function goHome() {
    window.location.href = "/home";
  }

  return (
    <header className="pp-navbar">

      <div className="pp-left">
        <div className="pp-brand" onClick={goHome}>
          <div className="pp-logo">PP</div>
          <div>
            <div>PosturePal</div>
            <div className="pp-small">Keep your desk posture healthy</div>
          </div>
        </div>
      </div>

      {/* Desktop actions */}
      <div className="pp-actions pp-actions-desktop">
        {/* Alerts */}
        <div style={{ position: "relative" }}>
          <button className="pp-icon-btn" onClick={() => setOpenAlerts(s => !s)}>
            <FiBell size={18} />
            {unread > 0 && <span className="pp-badge">{unread}</span>}
          </button>

          {openAlerts && (
            <div className="pp-alerts-dropdown">
              <div className="pp-alerts-header">
                <strong>Alerts</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pp-icon-btn pp-small" onClick={markAllRead}>
                    Mark all read
                  </button>
                  <button className="pp-icon-btn" onClick={() => setOpenAlerts(false)}>
                    <FiX />
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: 320, overflow: "auto", padding: 6 }}>
                {alerts.length === 0 && (
                  <div className="pp-alert-item">No alerts</div>
                )}

                {alerts.map(a => (
                  <div key={a.id} className={`pp-alert-item ${a.read ? "" : "unread"}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div className="pp-small" style={{ whiteSpace: "nowrap" }}>{a.time}</div>
                    </div>

                    <div className="pp-small" style={{ marginTop: 6 }}>{a.body}</div>

                    {a.image && <img src={a.image} className="pp-alert-image" alt="screenshot" />}

                    {!a.read && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button className="pp-icon-btn pp-small" onClick={() => markRead(a.id)}>
                          Mark read
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <button className="pp-icon-btn" onClick={goToPreview}>
          <FiEye size={18} />
        </button>

        {/* Auth */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="pp-icon-btn">
              <FiLogOut />
            </button>
          </SignOutButton>
        </SignedIn>

        <SignedOut>
          <SignInButton>
            <button className="pp-icon-btn">Log in</button>
          </SignInButton>
        </SignedOut>
      </div>

      {/* Mobile toggle */}
      <div className="pp-mobile-toggle">
        <button className="pp-icon-btn" onClick={() => setMobileOpen(s => !s)}>
          <FiMenu size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="pp-mobile-menu">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Menu</strong>
            <button className="pp-icon-btn" onClick={() => setMobileOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="pp-mobile-item" onClick={() => setOpenAlerts(true)}>
            <FiBell /> Alerts {unread > 0 && <span className="pp-badge">{unread}</span>}
          </div>

          <div className="pp-mobile-item" onClick={goToPreview}>
            <FiEye /> Preview
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", marginTop: 8, paddingTop: 8 }}>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
              <SignOutButton>
                <button className="pp-icon-btn">
                  <FiLogOut />
                </button>
              </SignOutButton>
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <button className="pp-icon-btn">Log in</button>
              </SignInButton>

              <SignUpButton mode="modal" redirectUrl="/preview">
                <button className="pp-icon-btn">Sign up</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}

      {/* Hidden Sign Up trigger */}
      <SignUpButton mode="modal" redirectUrl="/preview">
        <button id="pp-clerk-signup-trigger" style={{ display: "none" }} />
      </SignUpButton>
    </header>
  );
}
