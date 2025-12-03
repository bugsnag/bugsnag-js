require 'yaml'

# Provides information on browser support for features needed in the e2e tests.
# Source: caniuse.com
class Browser
  attr_reader :name

  def initialize(browser_spec)
    # e.g. "chrome_61", "edge_latest", "chrome"
    @name, version = browser_spec.split("_")

    # Assume Android runs the latest Chrome and iOS/Safari versions match.
    if @name == "android"
      @name = "chrome"
      @version = Float::INFINITY
    end
    @name = "safari" if @name == "ios"

    # Assume we're running the latest version if there is no version present.
    @version = if version.nil? || version == "latest"
                 Float::INFINITY
               else
                 Integer(version)
               end
  end

  # https://caniuse.com/wf-array-from
  def supports_array_from?
    case @name
    when "chrome"
      @version >= 45
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 38
    when "safari"
      @version >= 10
    when "ie"
      false # Determined manually using a test page
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/mdn-javascript_builtins_error_cause
  def supports_error_cause?
    case @name
    when "chrome"
      @version >= 93
    when "edge"
      @version >= 93
    when "firefox"
      @version >= 91
    when "safari"
      @version >= 15
    when "ie"
      false
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/fetch
  def supports_fetch?
    case @name
    when "chrome"
      @version >= 42
    when "edge"
      @version >= 14
    when "firefox"
      @version >= 39
    when "safari"
      @version >= 10  # 10.1
    when "ie"
      false
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/mdn-api_history
  def supports_history_management?
    case @name
    when "chrome"
      @version >= 4
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 2
    when "safari"
      @version >= 3 # 3.1
    when "ie"
      @version >= 10
    else
      # Assume support for unknown browsers
      true
    end
  end

  def supports_let?
    case @name
    when "chrome"
      @version >= 49
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 44
    when "safari"
      @version >= 11
    when "ie"
      @version >= 11 # Partial - let variables are not bound separately to each iteration of for loops
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/promises
  def supports_promise?
    case @name
    when "chrome"
      @version >= 33
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 29
    when "safari"
      @version >= 7 # 7.1
    when "ie"
      false
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/proxy
  def supports_proxy?
    case @name
    when "chrome"
      @version >= 49
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 18
    when "safari"
      @version >= 10
    when "ie"
      false
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/mdn-javascript_builtins_set
  def supports_set?
    case @name
    when "chrome"
      @version >= 38
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 13
    when "safari"
      @version >= 8
    when "ie"
      @version >= 11
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/mdn-api_window_unhandledrejection_event
  def supports_unhandled_rejection?
    case @name
    when "chrome"
      @version >= 49
    when "edge"
      @version >= 79
    when "firefox"
      @version >= 69
    when "safari"
      @version >= 11
    when "ie"
      false
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/weakmap
  def supports_weak_map?
    case @name
    when "chrome"
      @version >= 51
    when "edge"
      @version >= 15
    when "firefox"
      @version >= 54
    when "safari"
      @version >= 10
    when "ie"
      @version >= 11 # Partial - Notable partial support in IE11 includes (at least some) support for const, let, block-level function declaration, typed arrays, Map, Set and WeakMap.
    else
      # Assume support for unknown browsers
      true
    end
  end

  # https://caniuse.com/wf-xhr
  def supports_xml_http_request?
    case @name
    when "chrome"
      @version >= 4
    when "edge"
      @version >= 12
    when "firefox"
      @version >= 2
    when "safari"
      @version >= 3 # 3.1
    when "ie"
      @version >= 11 # Determined manually using a test page
    else
      # Assume support for unknown browsers
      true
    end
  end
end
