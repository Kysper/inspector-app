import { useState } from "react";
import "./assets/login.css";

export default function Login({ user, onLogin, onLogout }) {
    const [isOpen, setIsOpen] = useState(!user);
    const [username, setUsername] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const name = username.trim() || "Alex Kim";
        onLogin(name);
        setUsername(name);
        setIsOpen(false);
    };

    if (user) {
        return (
            <div className={`profile-area ${isOpen ? "is-open" : ""}`}>
                <button
                    className="profile-trigger"
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                >
                    <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                    <span className="profile-copy">
                        <strong>{user.name}</strong>
                        <small>Field inspector</small>
                    </span>
                    <span className="profile-chevron">⌃</span>
                </button>
                {isOpen && (
                    <div className="profile-menu">
                        <span className="profile-label">PROFILE</span>
                        <strong>{user.name}</strong>
                        <button type="button" onClick={onLogout}>Log out</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`profile-area login-area ${isOpen ? "is-open" : ""}`}>
            {isOpen ? (
                <form className="login-form" onSubmit={handleSubmit}>
                    <span className="profile-label">SIGN IN</span>
                    <input
                        className="username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Your name"
                        autoFocus
                    />
                    <button className="login-button" type="submit">Log in</button>
                </form>
            ) : (
                <button className="profile-trigger login-trigger" type="button" onClick={() => setIsOpen(true)}>
                    <span className="avatar">?</span>
                    <span className="profile-copy">
                        <strong>Log in</strong>
                        <small>Open profile</small>
                    </span>
                </button>
            )}
        </div>
    );
}