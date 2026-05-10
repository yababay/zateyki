import { visit } from "unist-util-visit"
import { h } from "hastscript"

export default function (option) {
  const className = (option && option.className) || "rehype-figure"

  function buildFigure({ properties }) {
    const figure = h("figure", { class: className }, [
      h("img", { ...properties, src: properties.src.replace(/.png$/, '.webp') }),
      properties.alt && properties.alt.trim().length > 0
        ? h("figcaption", properties.alt)
        : "",
    ])
    return figure
  }

  return function (tree) {
    visit(tree, { tagName: "p" }, (node, index) => {
      const images = node.children
        .filter((n) => n.tagName === "img")
        .map((img) => buildFigure(img))

      if (images.length === 0) return

      tree.children[index] =
        images.length === 1
          ? images[0]
          : (tree.children[index] = h(
              "div",
              { class: `${className}-container` },
              images
            ))
    })
  }
}
