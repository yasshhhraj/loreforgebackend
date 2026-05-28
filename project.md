# Loreforge Project Documentation

This document provides an overview of the Loreforge project's backend services, including their APIs and functionalities.

## Project Structure

The project has been refactored into a monolithic backend, with a separate service for the Large Language Model.

-   `server`: A monolithic service that handles user authentication, session management, game lobbies, and core game logic.
-   `llm`: Provides an interface to a Large Language Model.

## Services

### 1. Core Server

The `server` service is the main application, responsible for all user-facing APIs and WebSocket connections.

**Port:** 3333

#### REST API Endpoints

-   `POST /api/auth/google`
    -   **Description:** Authenticates a user with a Google ID token. Creates a session and returns a JWT.
    -   **Request Body:** `{ "idtoken": "..." }`
    -   **Response:** `{ "msg": "login success", "token": "..." }`
-   `POST /api/auth/logout`
    -   **Description:** Logs out the user and destroys the session.
-   `GET /api/me`
    -   **Description:** Returns the user's profile information from the session.
-   `GET /api/getToken`
    -   **Description:** Signs and returns a new JWT for the current session user.
    -   **Response:** `{ "token": "..." }`
-   `GET /api/verifylobby`
    -   **Description:** Verifies if a lobby with the given ID exists.
    -   **Query Parameters:** `id` (string)
    -   **Response:** `200 OK` with `{ "exists": true, "id": "..." }` or `404 Not Found` with `{ "exists": false }`.

#### Socket.IO Events

A single, persistent WebSocket connection is used for all real-time communication.

-   **Middleware:** Authenticates users via JWT on connection.
-   **Lobby Events:**
    -   `createlobby`: Creates a new lobby.
    -   `deletelobby`: Deletes an existing lobby.
    -   `joinlobby`: Joins a player to a lobby.
    -   `swapteam`: Swaps a player's team.
    -   `leaveLobby`: Removes a player from a lobby. Host is reassigned if they leave.
    -   `getlobby`: Retrieves lobby details.
    -   `toggleready`: Toggles a player's ready status.
    -   `kickplayer`: Kicks a player from a lobby. **Host only.**
    -   `startGame`: Initiates the game state on the server.
-   **Game Events:**
    -   `get_game`: Retrieves the current game state.
    -   `submission`: Submits a player's action. The action is evaluated by an AI model, and if valid, it's added to the game's chronicles.

### 2. LLM Service

The `llm` service provides an interface to the `ollama` Large Language Model.

**Port:** 3000

#### REST API Endpoints

-   `POST /api/chat`
    -   **Description:** Sends a prompt to the LLM and returns the response.
    -   **Request Body:** `{ "prompt": "Your prompt here" }`
    -   **Response:** The response from the Ollama model.
