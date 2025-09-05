import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import fs from 'fs/promises';
import { _PORT } from './app.js';
import { logError, __dirname } from './utilities.js';
import path from 'path';
export class SpotifyService {
    constructor(clientId, clientSecret, redirectUri) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.scopes = ["user-modify-playback-state", "user-read-playback-state", "user-read-currently-playing", "playlist-read-private", "user-top-read", "user-read-recently-played", "user-read-private"];
        this.tokenPath = path.join(__dirname, "tokens", ".spotifyToken.json");
    }
    ;
    async init() {
        try {
            const savedToken = await fs.readFile(this.tokenPath, 'utf-8');
            this.token = JSON.parse(savedToken);
            await this.setToken();
        }
        catch (err) {
            console.log(`authorize spotify here: http://127.0.0.1:${_PORT}/authorizeSpotify`);
        }
        ;
    }
    ;
    redirectLogin(req, res) {
        const query = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            scope: this.scopes.join(" "),
            redirect_uri: this.redirectUri
        });
        res.redirect("https://accounts.spotify.com/authorize?" + query.toString());
    }
    ;
    async handleCallback(req, res) {
        const code = req.query.code;
        if (!code) {
            logError("error while authenticating spotify, no code found", "error while authenticating spotify, no code found");
            return;
        }
        ;
        try {
            const response = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: this.redirectUri,
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                })
            });
            if (!response.ok) {
                const error = await response.text();
                logError(error, "spotify token exchange failed, check error_log.txt");
                return;
            }
            ;
            this.token = await response.json();
            await fs.writeFile(this.tokenPath, JSON.stringify(this.token), 'utf-8');
            this.setToken();
            res.send("spotify authorized succesfully");
        }
        catch (error) {
            logError(error, "error while authenticating spotify, check error_log.txt");
        }
    }
    ;
    async setToken() {
        try {
            this.spotify = SpotifyApi.withAccessToken(this.clientId, {
                access_token: this.token.access_token,
                token_type: "Bearer",
                expires_in: this.token.expires_in,
                refresh_token: this.token.refresh_token
            });
            setInterval(async () => {
                await this.refreshAccessToken();
            }, 3600 * 1000);
        }
        catch (error) {
            logError(error, "error while setting spotify token, check error_log.txt");
        }
        ;
    }
    ;
    async refreshAccessToken() {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.token.refresh_token
                })
            });
            if (!response.ok) {
                logError("error while refreshing token", "error while refreshing token");
                return;
            }
            ;
            const newToken = await response.json();
            const newAccessToken = newToken.access_token;
            this.token.access_token = newAccessToken;
            fs.writeFile(this.tokenPath, JSON.stringify(this.token), 'utf-8');
            this.spotify = SpotifyApi.withAccessToken(this.clientId, {
                access_token: this.token.access_token,
                token_type: "Bearer",
                expires_in: this.token.expires_in,
                refresh_token: this.token.refresh_token
            });
        }
        catch (error) {
            logError(error, "error while refreshing spotify token, check error_log.txt");
        }
        ;
    }
    ;
}
;
