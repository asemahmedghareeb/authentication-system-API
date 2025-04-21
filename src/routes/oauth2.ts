import express from 'express';
const router = express.Router();
import { getAccessAndRefreshToken, getNewAccessToken, OauthRedirectCallback, signup } from '../controllers/Oauth-controller';


router.get('/',signup);

router.post('/exchange-code', getAccessAndRefreshToken);

router.post('/request', OauthRedirectCallback);

router.post('/get-new-accessToken', getNewAccessToken);


export default router;