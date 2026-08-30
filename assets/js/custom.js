(function ($) {
  "use strict";

  // Header Type = Fixed
  $(window).scroll(function () {
      var scroll = $(window).scrollTop();
      var box = $('.header-text').height();
      var header = $('header').height();

      if (scroll >= box - header) {
          $("header").addClass("background-header");
      } else {
          $("header").removeClass("background-header");
      }
  });

  if ($.fn.owlCarousel && $('.loop').length) {
      $('.loop').owlCarousel({
          center: true,
          items: 1,
          loop: true,
          autoplay: true,
          nav: true,
          margin: 0,
          responsive: {
              1200: {
                  items: 5
              },
              992: {
                  items: 3
              },
              760: {
                  items: 2
              }
          }
      });
  }

  // Menu Dropdown Toggle
  if ($('.menu-trigger').length) {
      $(".menu-trigger").on('click', function () {
          $(this).toggleClass('active');
          $('.header-area .nav').slideToggle(200);
      });
  }

  // Menu elevator animation
  $('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function () {
      if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
          var target = $(this.hash);
          target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
          if (target.length) {
              var width = $(window).width();
              if (width < 991) {
                  $('.menu-trigger').removeClass('active');
                  $('.header-area .nav').slideUp(200);
              }
              $('html,body').animate({
                  scrollTop: (target.offset().top) + 1
              }, 700);
              return false;
          }
      }
  });

  $(document).ready(function () {
      $(document).on("scroll", onScroll);

      //smoothscroll
      $('.scroll-to-section a[href^="#"]').on('click', function (e) {
          e.preventDefault();
          $(document).off("scroll");

          $('.scroll-to-section a').each(function () {
              $(this).removeClass('active');
          })
          $(this).addClass('active');

          var target = this.hash,
              menu = target;
          var target = $(this.hash);
          $('html, body').stop().animate({
              scrollTop: (target.offset().top) + 1
          }, 500, 'swing', function () {
              window.location.hash = target;
              $(document).on("scroll", onScroll);
          });
      });
  });

  var getQuoteBtn = document.getElementById('getQuoteBtn');
  if (getQuoteBtn) {
      getQuoteBtn.addEventListener('click', function () {
          document.getElementById('quotePopup').style.display = 'block';
          document.getElementById('overlay').style.display = 'block';
      });
  }

  (function ($) {
      "use strict";

      // Existing code...

      function submitForm() {
          var name = document.getElementById('name').value;
          var email = document.getElementById('email').value;
          var phone = document.getElementById('phone').value;
          var projectTypeElements = document.getElementsByName('projectType');
          var projectType = [];
          projectTypeElements.forEach(function (element) {
              if (element.checked) {
                  projectType.push(element.value);
              }
          });
          var sqft = document.getElementById('sqft').value;

          // Validate form fields
          if (!name || !email || !phone || projectType.length === 0 || !sqft) {
              alert("Please fill in all required fields before submitting.");
              return;
          }

          // Log the values
          console.log('Name:', name);
          console.log('Email:', email);
          console.log('Phone:', phone);
          console.log('Project Type:', projectType.join(', '));
          console.log('Project Sqft:', sqft);

          // Display success message
          var successMessage = "Thank you for your Message, Our team will be with you shortly!";
          alert(successMessage);

          // Redirect to the home page after the alert
          window.location.href = "index.html";

          // Close the popup
          closePopup();
      }

      // Define the submitButton
      var submitButton = document.getElementById('submitButton');

      // Add a click event listener to the submitButton
      if (submitButton) {
          submitButton.addEventListener('click', submitForm);
      }

  })(window.jQuery);

  function onScroll(event) {
      var scrollPos = $(document).scrollTop();
      $('.nav a').each(function () {
          var currLink = $(this);
          var refElement = $(currLink.attr("href"));
          if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
              $('.nav ul li a').removeClass("active");
              currLink.addClass("active");
          } else {
              currLink.removeClass("active");
          }
      });
  }

  // Acc
  $(document).on("click", ".naccs .menu div", function () {
      var numberIndex = $(this).index();

      if (!$(this).is("active")) {
          $(".naccs .menu div").removeClass("active");
          $(".naccs ul li").removeClass("active");

          $(this).addClass("active");
          $(".naccs ul").find("li:eq(" + numberIndex + ")").addClass("active");

          var listItemHeight = $(".naccs ul")
              .find("li:eq(" + numberIndex + ")")
              .innerHeight();
          $(".naccs ul").height(listItemHeight + "px");
      }
  });



  // Get A Quote Popup
  // const openBtn = document.getElementById("openModal");
  // const closeBtn = document.getElementById("closeModal");
  // const modal = document.getElementById("modal");

  // openBtn.addEventListener("click", () => {
  //     modal.classList.add("open");
  // });

  // closeBtn.addEventListener("click", () => {
  //     modal.classList.add("open");
  // });

  // Page loading animation
  $(window).on('load', function () {
      $('#js-preloader').addClass('loaded');
  });

  // Window Resize Mobile Menu Fix
  function mobileNav() {
      var width = $(window).width();
      $('.submenu').on('click', function () {
          if (width < 767) {
              $('.submenu ul').removeClass('active');
              $(this).find('ul').toggleClass('active');
          }
      });
  }

})(window.jQuery);

