import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, SimpleSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { byDateAndAlphabetical } from "./PageList"
import style from "./styles/links.scss"
import { Date, getDate } from "./Date"
import { GlobalConfiguration } from "../cfg"

interface Options {
  title: string
}

const defaultOptions = (cfg: GlobalConfiguration): Options => ({
  title: "",
})

export default ((userOpts?: Partial<Options>) => {
  function Links({ allFiles, fileData, displayClass, cfg }: QuartzComponentProps) {
    const opts = { ...defaultOptions(cfg), ...userOpts }
    return (
      <div class={`links ${displayClass ?? ""}`}>
        <h3>{opts.title}</h3>
        <ul>
          <li>
            <h3 style={{marginTop: 0, marginBottom: 0}}><a href="/notes">Notes</a></h3>
            <i>자잘한 생각들을 적습니다</i>
          </li>
          <li>
            <h3 style={{marginTop: 0, marginBottom: 0}}><a href="/posts">Posts</a></h3>
            <i>보고 배운것을 정리하여 적습니다</i>
          </li>
          <li>
            <h3 style={{marginTop: 0, marginBottom: 0}}><a href="/projects">Projects</a></h3>
            <i>지금까지 만든 것에 대해 적습니다</i>
          </li>
        </ul>
      </div>
    )
  }

  Links.css = style
  return Links
}) satisfies QuartzComponentConstructor