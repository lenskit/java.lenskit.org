module LenskitHelper
  class LensKit
    def version
      "2.0.2"
    end
    def downloads
      "http://dl.bintray.com/grouplens/lenskit-releases"
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
