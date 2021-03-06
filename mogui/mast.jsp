<%--
$Id$

CDDL HEADER START

The contents of this file are subject to the terms of the
Common Development and Distribution License (the "License").
You may not use this file except in compliance with the License.

See LICENSE.txt included in this distribution for the specific
language governing permissions and limitations under the License.

When distributing Covered Code, include this CDDL HEADER in each
file and include the License file at LICENSE.txt.
If applicable, add the following below this CDDL HEADER, with the
fields enclosed by brackets "[]" replaced with your own identifying
information: Portions Copyright [yyyy] [name of copyright owner]

CDDL HEADER END

Copyright (c) 2005, 2010, Oracle and/or its affiliates. All rights reserved.
Portions Copyright 2011 Jens Elkner.

--%><%--

After include you are here: /body/div#page/div#content/

--%><%@ page session="false" errorPage="error.jsp" import="
java.io.File,
java.io.IOException,

org.opensolaris.opengrok.configuration.Project,
org.opensolaris.opengrok.history.HistoryGuru,
org.opensolaris.opengrok.web.EftarFileReader,
org.opensolaris.opengrok.web.PageConfig,
org.opensolaris.opengrok.web.Prefix,
org.opensolaris.opengrok.web.Util"%><%
/* ---------------------- mast.jsp start --------------------- */
{
    cfg = PageConfig.get(request);
    String redir = cfg.canProcess();
    if (redir == null || redir.length() > 0) {
        if (redir == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        } else {
            response.sendRedirect(redir);
        }
        return;
    }
    // jel: hmmm - questionable for dynamic content
    long flast = cfg.getLastModified();
    if (request.getDateHeader("If-Modified-Since") >= flast) {
        response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
        return;
    }
    response.setDateHeader("Last-Modified", flast);

    // Use UTF-8 if no encoding is specified in the request
    if (request.getCharacterEncoding() == null) {
        request.setCharacterEncoding("UTF-8");
    }

    // set the default page title
    String path = cfg.getPath();
    cfg.setTitle("Cross Reference: " + path);

    String context = request.getContextPath();
    cfg.getEnv().setUrlPrefix(context + Prefix.SEARCH_R + "?");

    String uriEncodedPath = cfg.getUriEncodedPath();
    String rev = cfg.getRequestedRevision();
%><%@
include file="httpheader.jspf"
%><body role="document">
<script type="text/javascript">/* <![CDATA[ */
    document.hash = '<%= cfg.getDocumentHash()
    %>';document.rev = '<%= rev
    %>';document.link = '<%= context + Prefix.XREF_P + uriEncodedPath
    %>';document.annotate = <%= cfg.annotate() %>;
    document.domReady.push(function() {domReadyMast();});
    document.pageReady.push(function() { pageReadyMast();});
    document.pageReady.push(function() { genSymbolList();});
/* ]]> */</script>
<div class="modal fade symbol-modal" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">Symbol List</h4>
      </div>
      <div class="modal-body" id="symbol-list">
      </div>
    </div>
  </div>
</div>
<form action="<%= context + Prefix.SEARCH_P %>"><%@
include file="pageheader.jspf"
%><div class="container">
    <div class="panel panel-default">
      <div class="panel-heading">
        <strong><a href="<%= context + Prefix.XREF_P %>/">Root</a></strong><%= Util
          .breadcrumbPath(context + Prefix.XREF_P, path,'/',"",true,cfg.isDir())
%>    </div>
      <div class="panel-body">
        <div class="input-group input-group-sm">
          <span class="input-group-addon"><%
Project proj = cfg.getProject();
String[] vals = cfg.getSearchOnlyIn();
%>          <input type="checkbox" aria-label="..." name="path" value='"<%= vals[0] %>"' <%= vals[2] %>>
              <span class="text-sm">Local</span>
          </span>
          <input type="text" class="form-control" placeholder="Search for..." id="search" name="q" />
          <span class="input-group-btn">
            <button class="btn btn-primary" type="submit">
              <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
            </button>
          </span>
        </div>
      </div>
    </div>
    <div class="panel panel-default" role="main">
      <div class="panel-body">
        <div class="btn-group btn-group-sm" role="toolbar"><%
if (!cfg.isDir()) {
  if (cfg.getPrefix() == Prefix.XREF_P) {
%>        <a type="button" class="btn btn-default active" onclick="javascript:lntoggle();return false;" aria-label="Show or hide line numbers (might be slower if file has more than 10 000 lines)." data-toggle="button" aria-pressed="true"><!--
            <span class="glyphicon glyphicon-list" aria-hidden="true"></span>-->
            Line Num
          </a>
          <a type="button" class="btn btn-default" onclick="javascript:lsttoggle();return false;" aria-label="Show or hide symbol list."><!--
            <span class="glyphicon glyphicon-jpy" aria-hidden="true"></span>-->
            Symbol
          </a><%
  }
%>        <a type="button" class="btn btn-default" aria-label="View raw source file" href="<%= context + Prefix.RAW_P + uriEncodedPath + (rev.length() == 0 ? "" : "?") + rev %>"><!--
            <span class="glyphicon glyphicon-file" aria-hidden="true"></span>-->
            Raw
          </a>
          <a type="button" class="btn btn-default" aria-label="Download" href="<%= context + Prefix.DOWNLOAD_P + uriEncodedPath + (rev.length() == 0 ? "" : "?") + rev %>"><!--
            <span class="glyphicon glyphicon-save" aria-hidden="true"></span>-->
            Download
          </a><%
}
%>    </div><%
if (proj != null) {
%>  <input type="hidden" name="project" value="<%=proj.getDescription()%>" /><%
}
%>
<%
}
/* ---------------------- mast.jsp end --------------------- */
%>
