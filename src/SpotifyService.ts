import { MaxInt, SpotifyApi } from '@spotify/web-api-ts-sdk';

import fs from 'fs/promises';
import { _PORT } from './app.js';
import { Response, Request } from 'express';
import { logError, __dirname, log } from './utilities.js';
import path from 'path';

type parsedSearch = {name: string; uri: string; artist?: string; album?: string;}[];

export class SpotifyService{
    private scopes: string[] = ["user-modify-playback-state", "user-read-playback-state", "user-read-currently-playing", "playlist-read-private", "user-top-read", "user-read-recently-played", "user-read-private"];
    private spotify!: SpotifyApi;
    private tokenPath = path.join(__dirname, "tokens", ".spotifyToken.json");
    private token!: any;

    constructor(private clientId: string, private clientSecret: string, private redirectUri: string, private preferedDevice?: string){};

    async init(){
        try{
        const savedToken = await fs.readFile(this.tokenPath, 'utf-8');
        
        this.token = JSON.parse(savedToken);
        await this.refreshAccessToken();
        await this.setToken();
        log("Spotify authenticated successfully with saved token");
        }catch(err){
            console.log(`authorize spotify here: http://127.0.0.1:${_PORT}/authorizeSpotify`);
        };
    };

    redirectLogin(req: Request, res: Response){
        const query = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            scope: this.scopes.join(" "),
            redirect_uri: this.redirectUri
        });

        res.redirect("https://accounts.spotify.com/authorize?" + query.toString());
    };

    async handleCallback(req: Request, res: Response){
        const code = req.query.code as string;

        if(!code){
            logError("error while authenticating spotify, no code found", "error while authenticating spotify, no code found");
            return;
        };

        try{
            const response = await fetch("https://accounts.spotify.com/api/token",
            {
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

            if(!response.ok){
                const error = await response.text();
                logError(error, "spotify token exchange failed, check error_log.txt");
                return;
            };

            this.token = await response.json();
            await fs.writeFile(this.tokenPath, JSON.stringify(this.token), 'utf-8');
            this.setToken();

            res.send("spotify authorized succesfully");
            log("Spotify authorized successfully, token saved to .spotifyToken.json");
        }catch(error){
            logError(error, "error while authenticating spotify, check error_log.txt");
        }
    };

    private async setToken(){
        try{
            this.spotify = SpotifyApi.withAccessToken(this.clientId, {
                access_token: this.token.access_token,
                token_type: "Bearer",
                expires_in: this.token.expires_in,
                refresh_token: this.token.refresh_token
            });

            setInterval(async ()=>{
                await this.refreshAccessToken();
            }, 3600*1000);
        }catch(error){
            logError(error, "error while setting spotify token, check error_log.txt");
        };
    };

    private async refreshAccessToken(){
        try{
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

            if(!response.ok){
                logError("error while refreshing token", "error while refreshing token");
                return;
            };

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
        }catch(error){
            logError(error, "error while refreshing spotify token, check error_log.txt");
        };
    };

    async search(query: string, type: "track" | "album" | "artist" = "track", limit: MaxInt<50> = 5) {
        try{
            const response = await this.spotify.search(query, [type], undefined, limit);
            let parsed: parsedSearch
        
            switch(type){
                case "track":
                    parsed = response.tracks.items.map(track =>{
                        const artists = track.artists.map(artist => artist.name);
                        
                        return {
                            name: track.name,
                            artists: artists,
                            album: track.album.name,
                            uri: track.uri
                        };
                    });
                    break;
                case "album":
                    parsed = response.albums.items.map(album =>{
                        const artists = album.artists.map(artist => artist.name);

                        return {
                            name: album.name,
                            artists: artists,
                            uri: album.uri
                        };
                    });
                    break;
                case "artist":
                    parsed = response.artists.items.map(artist => {
                        return {
                            name: artist.name,
                            uri: artist.uri
                        };
                    });
            };
            return parsed;
        }catch(error){
            logError(error, "error while searching spotify, check error_log.txt");
            return "error while searching";
        };
    };

    async play(query?: string, type: "track" | "album" | "artist" = "track"){
        try{
            const response = await this.spotify.player.getAvailableDevices();
            let deviceId: string = "";
            let contextUri: string | undefined = undefined;
            let uri: string[] | undefined = undefined;

            if(this.preferedDevice) deviceId = this.preferedDevice; // set as fallback if no other device is active
            
            for(const device of response.devices){
                if(device.is_active){
                    if(device.id) deviceId = device.id
                };
            };

            if(query){
            const result = await this.search(query, type, 1);

            if(typeof result === "string") return result;
            
            if(type === "track"){uri = [result[0].uri]}
            else{contextUri = result[0].uri};
            };

            await this.spotify.player.startResumePlayback(deviceId, contextUri, uri);
            return "playback started succesfully";
        }catch(error: any){
            if(!error.message.includes("JSON")){
                logError(error, "error while start/resume spotify playback, check error_log.txt");
                return "error while starting / resuming playback"
            };
            return "playback started succesfully";
            //errors with JSON are most likely sdk bugs
        };
    };

    async addtoQueue(query: string){
        try{
            const result = await this.search(query, undefined, 1);

            if(typeof result === "string") return result;

            await this.spotify.player.addItemToPlaybackQueue(result[0].uri);

        }catch(error: any){
            if (!error.message.includes("Unexpected token")) logError(error, "error while adding to spotify queue, check error_log.txt");
            //ingore sdk bug
        };
    };

    async toggleShuffle(state: boolean){
        try{
            await this.spotify.player.togglePlaybackShuffle(state);
        }catch(error: any){
            if (!error.message.includes("Unexpected")) logError(error, "error while toggling spotify shuffle, check error_log.txt");
            //ignore sdk bug
        };
    };
};

