module LenskitNews
  def item_date(item)
    attribute_to_time(item[:created_at]).strftime("%b %-d, %Y")
  end
end