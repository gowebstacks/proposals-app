import { NextStudio } from 'next-sanity/studio'
import config from '../sanity.config'

export default function StudioLayout() {
  return (
    <html lang="en">
      <body>
        <NextStudio config={config} />
      </body>
    </html>
  )
}
