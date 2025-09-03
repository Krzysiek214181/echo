# echo

### what is echo?

**echo** is an `AI agent` created by me ( Krzysztof Szklarski ) to serve as a *"room agent"*, 

intended to be used as a helper who controls things like your music, reads your mail and check calendar  
**but** it can also interact with physical things in your room with the use of http servers using `arduinos` for things like closing the blinds, locking the door etc.

### TODO: add demo here

## how does *echo* work internally?

below you can see a simple diagram showcasing the overall architecture of **echo**:
<br><br>

<img width="583" height="451" alt="diagram" src="https://github.com/user-attachments/assets/23d66188-e9d2-4e7a-890a-ec4fa37c8228" />

<br><br>
the concept is pretty simple, the `user` talks with the main `conversational model` ( also serving the function of a `router` ) when this model detects that the user wants to use some of the functions avaible in the
*modules*, it writes a userPrompt for one of the models:

* `room model` **-** this model controls the physical things in the room ( arduinos, smart sockets etc. )
  
* `googleAPI model` **-** this model can communicate with google's API's to use `gmail` and `google calendar`
  
* `media control model` **-** this model controls spotify via spotifyAPI

# running echo locally

i would highly reccomend running `echo` as a `docker container`, so i include a `Dockerfile` in the repository,  
however, i do not release the built image, because i think `echo` is not really an "out of the box" app, and for it to work with your setup, you will have to tweak it a little bit

> for those unfamiliar with docker, to build the image just run `docker build -t <image_name>`

### environmental variables

* `PORT` **-** the port the app will be listening on
  
* `GOOGLE_CLIENT_ID` **-** the *Client ID* from Google Cloud
  
* `GOOGLE_CLIENT_SECRET` **-** the *Client Secret* from Google Cloud
  
* `GOOGLE_REDIRECT` **-** the *Authorized redirect URI* for the client from Google Cloud

* `GOOGLE_SHARED_CALENDAR_ID` **-** the *ID* of a shared google calendar you want to be able to view
  
* `OPENAI_API_KEY` **-** the *API KEY* from OpenAI Platform

### volume mounts

* `app/logs/` **-** directory with `log.txt` & `error_log.txt`
  
* `app/.googleToken` **-** storage for google's OAuth2 token

## example docker-compose.yml

```YAML
services:
  echo:
    image: <image_name>
    container_name: echo
    expose:
      - ${PORT}
    environment:
      - PORT=${PORT}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REDIRECT=${GOOGLE_REDIRECT}
      - GOOGLE_SHARED_CALENDAR_ID=${GOOGLE_SHARED_CALENDAR_ID}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - <your_path>:/app/.googleToken
      - <your_path>:/app/logs/
    restart: unless-stopped
```

make sure you also have an `.env` file in the same directory, filled accordingly to `.env-example`

## example docker run

```bash
docker run -d --name echo --expose <selected_port> -e PORT=<selected_port> -e GOOGLE_CLIENT_ID=<client_id> -e GOOGLE_CLIENT_SECRET=<client_secret> -e GOOGLE_REDIRECT=<redirect_url> -e GOOGLE_SHARED_CALENDAR_ID=<calendar_id> -e OPENAI_API_KEY=<openai_api_key> -v <your_path>:/app/.googleToken -v <your_path>:/app/logs/ --restart unless-stopped <image_name>
```
