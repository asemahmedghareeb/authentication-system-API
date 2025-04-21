import express from 'express';
const router = express.Router();
import { exchangeCode, getNewAccessToken, OauthRequest, signup } from '../controllers/Oauth-controller';


router.get('/',signup);

router.post('/exchange-code',exchangeCode );

router.post('/request', OauthRequest);

router.post('/get-new-accessToken', getNewAccessToken);


export default router;