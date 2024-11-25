interface Config {
  googleClientId: string
}

export default function config(): Config {
  if (window.location.hostname === 'minside.jpro.no') {
    return {
      googleClientId:
        '742259097135-amdq1io2p7t7e4jud14o4deaokp5acl1.apps.googleusercontent.com',
    }
  } else {
    return {
      googleClientId:
        '365277685106-agts9g8tvljvdflgqottt52ujp8p989d.apps.googleusercontent.com',
    }
  }
}
