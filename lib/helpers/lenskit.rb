module LenskitHelper
  class LensKit
    def version
      "2.0.3.2"
    end
    def downloads
      "http://files.grouplens.org/lenskit/releases"
    end
    def [](key)
      case key
        when :version
        version
      end
    end
  end
  def lenskit
    LensKit.new()
  end
end
