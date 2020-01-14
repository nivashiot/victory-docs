import React from "react";
import PropTypes from "prop-types";
import { Link, PrefetchWhenSeen } from "react-static";
import { maxBy, minBy, isEmpty } from "lodash";
import styled from "styled-components";

import { SidebarSectionSublist } from "../styles";

const getLinkStylesByDepth = (depth, theme) => {
  if (depth === 2) {
    return {
      "font-size": "1.4rem",
      height: "3rem",
      color: theme.color.brown,
      "letter-spacing": "0.53px"
    };
  }

  if (depth === 3) {
    return {
      "font-size": "1.2rem",
      color: theme.color.darkBrown
    };
  }
  return {};
};

const SubItemListItem = styled.li`
  padding-left: ${({ depth }) => (depth === 3 ? "7.7rem" : "5.3rem")};
  line-height: ${({ depth }) => (depth === 3 ? "1.3rem" : "2.3rem")};
  margin: ${({ depth }) => (depth === 3 ? "0 .7rem 1.3rem 0" : "0 0 0.7rem 0")};
  display: block;
  hyphens: auto;
`;
const SubItemLink = styled(Link)(props => ({
  ...getLinkStylesByDepth(props.depth, props.theme),
  "font-family": props.theme.font.bold
}));

class TableOfContents extends React.Component {
  getTree(headings) {
    if (!headings || !headings.length) {
      return [];
    }
    const depth = minBy(headings, "depth").depth;
    const maxDepth = maxBy(headings, "depth").depth;
    if (depth === maxDepth) {
      return headings;
    }
    const parentIndices = headings.reduce((memo, curr, index) => {
      if (curr.depth === depth) {
        memo = memo.concat(index);
      }
      return memo;
    }, []);
    return parentIndices.reduce((memo, curr, index) => {
      const lastChild =
        index === parentIndices.length + 1
          ? undefined
          : parentIndices[index + 1];
      const children = [headings.slice(curr + 1, lastChild)];
      memo =
        children.length > 0
          ? memo.concat(headings[curr], children)
          : memo.concat(headings[curr]);
      return memo;
    }, []);
  }

  getTOC(active, link, headings, i = 0) {
    const tree = this.getTree(headings);

    if (!tree.length) {
      return null;
    }

    const toAnchor = content => {
      const baseContent = content.toLowerCase();
      const safeString = baseContent.replace(/[^\w]+/g, " ");
      return safeString.trim().replace(/\s/g, "-");
    };

    const depth = minBy(headings, "depth").depth;

    return (
      <SidebarSectionSublist>
        {tree.map((item, index) => {
          if (Array.isArray(item)) {
            return (
              <li key={`${i}-${depth}`}>
                {this.getTOC(active, link, item, i++)}
              </li>
            );
          }
          // unfortunately we can't treat "active" and "search term hit" as the same -- if it's active then
          // it's a purely relative link hash, if it's from a search tem hit then we need the type and slug.
          const hashPath = `#${toAnchor(item.value)}`;
          const absPath = `/${link.type}/${link.slug}`;
          // Normally I'd lean way back in a wicker chair on the porch, snap my suspenders, shake my head,
          // and take a long sip from a mint julep while mumbling something about the brittleness of scope and the joys of
          // referential transparency, but we're not generalizing this behavior and location-injection is table stakes
          // for front-end routing
          const path = this.props.location.pathname.includes(absPath)
            ? hashPath
            : `${absPath}${hashPath}`;

          return item.depth > 1 ? (
            <SubItemListItem key={index} isActive={active} depth={item.depth}>
              <PrefetchWhenSeen path={path}>
                <SubItemLink
                  depth={item.depth}
                  to={path}
                  prefetch={"data"}
                  scrollToTop
                >
                  {item.value}
                </SubItemLink>
              </PrefetchWhenSeen>
            </SubItemListItem>
          ) : null;
        })}
      </SidebarSectionSublist>
    );
  }

  render() {
    const { active, link, headings } = this.props;
    return active && !isEmpty(headings)
      ? this.getTOC(active, link, headings)
      : null;
  }
}

TableOfContents.propTypes = {
  active: PropTypes.bool,
  headings: PropTypes.array,
  link: PropTypes.object,
  location: PropTypes.object,
  searchTerm: PropTypes.string
};

export default TableOfContents;
