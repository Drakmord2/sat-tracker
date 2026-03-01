# Satellite tracker

Based on https://github.com/troilus/predict

[User Manual](https://github.com/troilus/predict/blob/main/HowToUse.md)

## Features
- Specific satellite pass information calculation
- Use the phone to point at the satellite
- Add calendar reminder
- Frequency doppler display
- SSTV decode

## Self Host

1. Create a local SSL cert
```shell
cd cert;

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -keyout localhost.key -out localhost.crt -days 365 \
  -subj "/C=US/ST=New York/L=New York/O=SatTracker/OU=Dev/CN=localhost";
```
If using iOS, you need to send the localhost.crt to the phone, install it as a profile and allow trust as a root certificate.

2. Start the HTTPS server
```shell
python3 server.py <optional port>;
```
3. Update TLE database

```shell
sh ./update_tle.sh
```
4. Visit https://localhost:\<port\> on a browser

---

![image](./assets/398651661-b3f25fe0-a0d7-4f1b-8399-e2fc748120e1.png)
![image](./assets/398651820-f56bee9a-49da-4a48-96db-7c394d5e3c09.png)
<img width="390" height="688" alt="image" src="./assets/482912705-b706b319-d339-415a-b782-d7df7c01c53c.png" />

## Sources
- https://www.amsat.org (TLEs)
- https://db.satnogs.org (Active satellites)
- https://github.com/shashwatak/satellite-js
- https://github.com/mourner/suncalc
- https://github.com/Equinoxis/sstv-decoder
