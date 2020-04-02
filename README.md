# TrackCOVID
A peer-to-peer, privacy-preserving contact tracing smartphone application

This project is in beta.

https://trackcovid.net

## Web App

A mobile-friendly web app is available for immediate use without any downloads or registration.

https://trackcovid.net/app

## Public Checkpoints

We have created a link which generates a public checkpoint as a printable PDF. Public checkpoints should be generated once per location, per day, and can be posted at public places like stores and workplaces. Public checkpoints can be easily and quickly scanned by anyone with a smartphone as they enter, without entering any information or downloading an application.

https://trackcovid.net/public-checkpoint

## Admin interface

The admin interface is a feature which would allow authorized users from laboratories and/or health care facilities to issue confirmation codes for diagnoses. The current admin interface is for demonstration purposes only, but it is functional. You can try generating a confirmation code and then use it to confirm your self-report in the app. The [paper](https://preprints.jmir.org/preprint/18936/accepted) provides more details on the use of confirmation codes.

Login with:
- Username: `user`
- password: `pass`

https://trackcovid.net/admin

## Mobile App

The web app, above, is the best way to use TrackCOVID at the moment. However, I have developed a prototype for Android and iOS. (Web, Android, and iOS apps are equivalent in functionality.)

Android users may try out the prototype at https://expo.io/@tyleryasaka/covidwatch.

I am currently unable to distribute a prototype for the iPhone, but the application has been tested and works on iOS devices.

See [covidwatch-app](covidwatch-app) for source code and details.

## Server
See [covidwatch-server](covidwatch-server) for source code.

Login with:
- Username: `user`
- password: `pass`

See [covidwatch-server](covidwatch-server) for source code.

## Network Simulation Model
This is a simplistic model which serves as a proof-of-concept that TrackCOVID's peer-to-peer contact tracing method has potential to impact the outcome of an epidemic, in the right circumstances (including sufficient user adoption). This model was described in the [paper](https://preprints.jmir.org/preprint/18936/accepted).

Web interface for the simulation: https://tyleryasaka.shinyapps.io/covidwatch/

See [covidwatch-model](covidwatch-model) for source code.
