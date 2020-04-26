# TrackCOVID

QR Code-Based Contact Tracing for Communities

This is an open source project which we provide freely to communities which are interested in setting up digital contact tracing to supplement manual contact tracing in a way that is both easy to use and 100% private.

We propose a concrete strategy for setting up QR code-based contact tracing in your community, and we provide all of the source code necessary for this to happen. We believe our approach can add an additional layer of protection as public places begin reopening. Manual contact tracing in public places is very difficult, if not impossible in many cases. Our approach can help to notify people of potential exposure at these public places in a way that does not invade their privacy.

If you are interested, we are happy to collaborate as needed to make this a reality in your community. We do this as a public service without asking for anything in return.

![flyer](doc/qr-contact-tracing-flyer.png)

- Learn more:
https://trackcovid.net
- Read the peer-reviewed paper in JMIR mHealth and uHealth:
https://doi.org/10.2196/18936
- Read my proposal for public checkpoints:
https://tyleryasaka.me/2020/04/07/public-checkpoints/
- Link to the [downloadable flyer](doc/qr-contact-tracing-flyer.pdf) for communities

## Web App

We have a proof-of-concept web app which you are welcome to check out. A similar web app would be set up for your community.

https://trackcovid.net/app

## Public Checkpoints

We have created a link which generates a public checkpoint as a printable PDF. Public can be posted at public places like stores and workplaces. Public checkpoints can be easily and quickly scanned by anyone with a smartphone as they enter, without entering any information or downloading an application. You may check out the example below:

https://trackcovid.net/checkpoint

## Admin interface

The admin interface is a feature which would allow authorized users from health care facilities to upload QR code histories on behalf of diagnosed users. The current admin interface is for demonstration purposes only, but it is functional.

Login with:
- Username: `user`
- password: `pass`

https://trackcovid.net/admin

## Server

See [trackcovid-server](trackcovid-server) for source code.

## Network Simulation Model
This is a simplistic model which serves as a proof-of-concept that TrackCOVID's peer-to-peer contact tracing method has potential to impact the outcome of an epidemic, in the right circumstances (including sufficient user adoption). This model was described in the [paper](https://doi.org/10.2196/18936).

Web interface for the simulation: https://tyleryasaka.shinyapps.io/covidwatch/

See [trackcovid-model](trackcovid-model) for source code.

## Contributors

- [Ben Stedman](https://benstedman.com/): logo
- [Tyler Yasaka](https://tyleryasaka.me/): development
- [@equinteros61](https://github.com/equinteros61): translation (Spanish)
- [@sawravchy](https://github.com/sawravchy): translation (Bengali)
- You? (check out our [interest form](https://docs.google.com/forms/d/e/1FAIpQLSfj8AxQ5hVYF2cvlZGv1yopOCLHn71NigqPjyFYSv6sEaQijg/viewform?usp=sf_link))
