import { useLocation, useNavigate, useParams } from "react-router-dom";

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams();

  const navigateTo = (navigateOptions = {}) => {
    if (navigateOptions === -1) {
      navigate(-1);
      return;
    }
    const { object, recordId, action } = navigateOptions;
    let path = "";
    let options = {};
    if (object === "workspace") {
      if (action === "home") {
        path = "/workspaces";
      } else if (action === "view") {
        path = `/workspaces/${recordId}/view`;
      } else if (action === "edit") {
        path = `/workspaces/${recordId}/edit`;
      } else if (action === "delete") {
        path = `/workspaces/${recordId}/delete`;
      } else if (action === "new") {
        path = `/workspaces/new`;
      }
    } else if (object === "document") {
      if (action === "view") {
        path = `/workspaces/${workspaceId}/documents/${recordId}/view`;
      } else if (action === "edit") {
        path = `/workspaces/${workspaceId}/documents/${recordId}/edit`;
      } else if (action === "delete") {
        path = `/workspaces/${workspaceId}/documents/${recordId}/delete`;
      } else if (action === "new") {
        path = `/workspaces/${workspaceId}/documents/new`;
      }
    } else if (object === "prompt") {
      if (action === "view") {
        path = `/workspaces/${workspaceId}/prompts/${recordId}/view`;
      } else if (action === "edit") {
        path = `/workspaces/${workspaceId}/prompts/${recordId}/edit`;
      } else if (action === "delete") {
        path = `/workspaces/${workspaceId}/prompts/${recordId}/delete`;
      } else if (action === "new") {
        path = `/workspaces/${workspaceId}/prompts/new`;
      }
    } else {
      const lastVisitedPath = localStorage.getItem("lastVisitedPath");
      if (lastVisitedPath) {
        path = lastVisitedPath;
      } else {
        path = "/workspaces";
      }
    }
    if (action === "edit" || action === "delete" || action === "new") {
      options.state = { backgroundLocation: location };
    } else {
      localStorage.setItem("lastVisitedPath", path);
    }
    console.log("useAppNavigate: navigating to", path, "with options", options);
    navigate(path, options);
  };

  return navigateTo;
}
