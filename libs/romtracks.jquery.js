var TRACKS = TRACKS || {};

TRACKS.Settings = {
	
};

TRACKS.useEvents = function( className )
{
	TRACKS.mix( M.EventDispatcher, className  );
};

/**
 * Bind function context.
 * 
 * @method bind
 * @param fn
 * @param c
 */
TRACKS.bind = function(fn, c) 
{
    return function() {
        return fn.apply(c || fn, arguments);
    };
};

/**
 * Extend a class
 * 
 * @param subClass
 * @param superClass
 */
TRACKS.mix = function(source, dest) {

	var tmp = dest.prototype;
	
	dest.prototype = new source();
	dest.prototype.constructor = dest;
	
	for( var key in tmp )
		dest.prototype[key] = tmp[key];
};

TRACKS.one = function( selector, parent )
{
	var result = jQuery( selector );

	if( parent )	
		result = jQuery( parent ).find( selector );
		
	return result[0];
};

TRACKS.all = function( selector, parent )
{
	var result = jQuery( selector );

	if( parent )	
		result = jQuery( parent ).find( selector );
		
	return result;
};

TRACKS.append = function( element, content )
{
	return jQuery( element ).append( content );
};

TRACKS.mask = function( element, text )
{
	return jQuery( element ).mask(text);
};

TRACKS.unmask = function( element )
{
	return jQuery( element ).unmask();
};

TRACKS.getSelected = function( element )
{
	return jQuery(element).find(":selected")[0]
}

TRACKS.isMasked = function( element )
{
	return jQuery( element ).isMasked();
};

TRACKS.wrap = function( element, content )
{
	return jQuery( element ).wrap( content );
};

TRACKS.trimString = function( string, count )
{
	return string.substring(0, count) + "...";
};

// Merge Arrays
TRACKS.merge = function( first, second )
{
	return jQuery.merge( first, second );
};

// Merge objects
TRACKS.extend = function( first, second )
{
	return jQuery.extend( first, second );
};

TRACKS.ie = function()
{
	var result = 0;
	
	if( jQuery.browser.msie == true )
		result = jQuery.browser.version.slice(0, 1);
	
	return result;
};

TRACKS.delegate = function( parent, selector, eventType, handler )
{
	return jQuery(parent).delegate( selector, eventType, handler );
};

TRACKS.on = function( selector, eventType, handler )
{
	return jQuery(selector).on( eventType, handler );
};

TRACKS.css = function( container, property, value )
{
	return  jQuery(container).css( property, value );
};

TRACKS.addClass = function( element, className )
{
	jQuery(element).addClass(className);
};
		
TRACKS.removeClass = function( element, className)
{
	jQuery(element).removeClass(className);
};

TRACKS.hasClass = function( element, className )
{
	return jQuery(element).hasClass(className);
};

TRACKS.decodeHTML = function( encodedString )
{
	return jQuery("<div/>").html(encodedString).text();
};

TRACKS.queryStringParameter = function( name ) {

    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

TRACKS.scrollTop = function( container, parent, elementToScrollTo, offset )
{
	jQuery(parent).scrollTop(0);
	
	jQuery(parent).animate(
		{ 
			scrollTop: jQuery(elementToScrollTo).offset().top - jQuery(container).offset().top - offset
		 }, 
		 { 
		 	duration: 300 
		 } );
};

TRACKS.toggle = function ( selector, duration, easing, callback )
{
	jQuery(selector).toggle( duration, easing, callback );
};

TRACKS.fadeToggle = function ( selector, duration, callback )
{
	jQuery(selector).fadeToggle( duration, callback );
};

TRACKS.height = function ( selector, height )
{
	jQuery(selector).height( height );
};

TRACKS.width = function ( selector, width )
{
	jQuery(selector).width( width );
};

TRACKS.isString = function(input)
{
    return typeof(input)=='string';
};

TRACKS.stringToBoolean = function(string){
	if (TRACKS.isString(string))
	{
        switch(string.toLowerCase()){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
        }
     }
     
     return string;
};

/*
 * Sets the hash in the URL
 * @param content - array of values to be put in the URL hash
 * @param separator - used for separating the values in the 'content' array
 */
TRACKS.setUrlHash = function (content) {
    if (!content || content.length == 0) {
        window.location.hash = '';
        return;
    }

    window.location.hash = content;
};

/*
 * Gets the hash present in the URL in the form
 * of an array separated by the given or default separator
 * @param separator - separator if multiple values present in the URL hash
 */
TRACKS.getUrlHash = function () {
    return window.location.hash;
};

TRACKS.NumberFormat = function( nStr, thousandSeparator, decimals, decimalSeparator )
{
	if( !decimals)
		nStr = Math.ceil(Number(nStr));
	else
		nStr = Number(nStr).toFixed( decimals );
	
	if (!thousandSeparator)
		thousandSeparator = " ";
		
	if (!decimalSeparator)
		decimalSeparator = "";
		
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? decimalSeparator + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + thousandSeparator + '$2');
	}
	
	return x1 + x2;
}

TRACKS.openFancyBox = function( urls )
{
	//do not open fancy box if nothing to open
	if ( urls.length > 0 )
		$.fancybox.open(urls);
}

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

