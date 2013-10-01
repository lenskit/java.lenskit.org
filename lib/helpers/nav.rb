module LenskitNavigation
  def nav_class(item, entry)
    url = entry[:url]
    if item.path == url || (url != '/' && item.path.start_with?(url))
      "current"
    else
      ""
    end
  end
end