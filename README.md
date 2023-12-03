# headscale-admin

Headscale-Admin is a Web Interface for [juanfont/headscale](https://github.com/juanfont/).

### IN ACTIVE DEVELOPMENT

Headscale-Admin should **not** be considered a production-ready application. It is very much still in active development and should be treated as such. I am not a professional developer and therefore my production is not as streamlined as it otherwise could be.

#### Documentation will be coming soon.

### Known Issues
- No API key rotation yet
- No selection of PreAuthKey in deployment yet
- PreAuthKeys in general are ugly looking


### Home Page
A brief overview of the HeadScale environment with the number of users, nodes, and routes.
<img width="1089" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/75fb74ec-aa31-433e-a51c-812de1c12592">

### Users Page
An overview of all headscale Users with a List or Tile layout.
- Create and Delete Users
- Create and Manage PreAuth Keys
- List User's Nodes with Online Indicators

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/4c30aea5-c394-46ce-b555-a52fcda8d384">

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/9d0b8a8a-108e-43ea-ba82-9dee4edaf831">

<img width="632" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/5a648b9b-e381-45b7-985e-a62989c6487e">


### Nodes Page
An overview of all headscale Nodes with a List or Tile layout.
- Create and Delete Nodes
- Enable/Disable Advertised Routes
- Expire a Node

<img width="1089" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/1aa275c9-cc4c-4fea-9580-629cb6bbfe43">

<img width="1094" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/6f95b076-c429-4d3b-8fd0-8e9bf0129ca8">

<img width="626" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/96a84390-5a0a-42ce-9c96-5809650589b4">

### Deploy Page
A web utility to craft a "tailscale up" command when deploying new nodes. 

**NOTE:** currently there is no option yet to select a PreAuth Key. That will be in the next update.

<img width="1086" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/7e9a4d03-f839-408b-814c-e7801397b13a">


### Settings Page
Store API URL and API Key information in the browser's LocalStorage. Set API refresh interval (how frequently users, preauth keys, nodes, and routes are updated). Enable/Disable console debugging (may get noisy).

<img width="1087" alt="image" src="https://github.com/GoodiesHQ/headscale-admin/assets/4576046/6790339c-4a9d-4f8f-8975-e4983f59cad9">
