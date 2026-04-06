// Set default whitelist for tests so guardAccess allows test usernames through
process.env.WHITELIST = "anuraghazra,renovate-bot,ashiknesin,Yizack,ffflabs";
process.env.GIST_WHITELIST = "bbfce31e0217a3689c8d961a356cb10d";
// Set NODE_ENV to production to enable caching in tests
process.env.NODE_ENV = "production";
// Set a mock PAT for retryer tests
process.env.PAT_1 = "mock_token_for_testing";
